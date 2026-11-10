import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cloneBare, git, isAncestor } from './git.js';

export const TRUNK_LIMIT = 400;
export const BRANCH_LIMIT = 120;
export const CLONE_TIMEOUT_MS = 120_000;
const STALE_DAYS = 90;
const LOG_FORMAT = '--format=%H|%P|%an|%at|%s';

export class ScanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScanError';
  }
}

function parseCommit(line) {
  const [sha, parents, author, at, ...message] = line.split('|');
  const parentList = parents ? parents.split(' ') : [];
  return {
    sha,
    parents: parentList,
    isMerge: parentList.length > 1,
    author,
    date: new Date(Number(at) * 1000).toISOString(),
    message: message.join('|'),
  };
}

async function count(cwd, args) {
  return Number(await git(cwd, args));
}

function cloneWithTimeout(cloneUrl, repoDir) {
  let timeoutId;
  const clone = cloneBare(cloneUrl, repoDir);
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new ScanError('Repository cloning exceeded the 120 second limit. Try a smaller repository or try again later.');
      error.code = 'CLONE_TIMEOUT';
      reject(error);
    }, CLONE_TIMEOUT_MS);
  });
  return Promise.race([clone, timeout]).finally(() => clearTimeout(timeoutId));
}

export async function scanRepo({ cloneUrl, owner, name }) {
  const temp = await mkdtemp(join(tmpdir(), 'gitverse-'));
  const repoDir = join(temp, 'repo.git');
  const stages = [];
  const markStage = (stage) => stages.push({ stage, timestamp: new Date().toISOString() });

  try {
    markStage('cloning');
    try {
      await cloneWithTimeout(cloneUrl, repoDir);
    } catch (error) {
      if (error instanceof ScanError) throw error;
      throw new ScanError('Could not read this repository. Make sure it exists and is public.');
    }

    markStage('reading branches');
    const defaultBranch = await git(repoDir, ['symbolic-ref', '--short', 'HEAD']).catch(() => '');
    const refsOut = await git(repoDir, ['for-each-ref', '--format=%(refname:short)|%(objectname)|%(committerdate:unix)', 'refs/heads']);
    const refs = refsOut.split('\n').filter(Boolean).map((line) => {
      const [branchName, tip, unix] = line.split('|');
      return { name: branchName, tip, unix: Number(unix), lastActive: new Date(Number(unix) * 1000).toISOString() };
    });
    if (!defaultBranch || !refs.some((ref) => ref.name === defaultBranch)) {
      throw new ScanError('The repository default branch could not be found.');
    }

    markStage('reading commits');
    const trunk = (await git(repoDir, ['log', '--first-parent', `-n${TRUNK_LIMIT}`, LOG_FORMAT, defaultBranch]))
      .split('\n').filter(Boolean).map(parseCommit);
    const branches = await Promise.all(refs.map(async (ref) => {
      const base = { ...ref, forkPoint: null, commits: [], commitCount: 0, lane: 0 };
      try {
        const isDefault = ref.name === defaultBranch;
        const commitCount = await count(repoDir, isDefault
          ? ['rev-list', '--count', ref.name]
          : ['rev-list', '--count', ref.name, '--not', defaultBranch]);
        if (isDefault) return { ...base, status: 'sacred', commitCount };
        const forkPoint = await git(repoDir, ['merge-base', ref.name, defaultBranch]).catch(() => null);
        const absorbed = await isAncestor(repoDir, ref.tip, defaultBranch);
        const commits = commitCount > 0
          ? (await git(repoDir, ['log', `-n${BRANCH_LIMIT}`, LOG_FORMAT, ref.name, '--not', defaultBranch]))
            .split('\n').filter(Boolean).map(parseCommit)
          : [];
        const status = absorbed
          ? 'absorbed'
          : Date.now() - ref.unix * 1000 > STALE_DAYS * 86400000 ? 'pruned' : 'active';
        return { ...base, status, forkPoint, commits, commitCount };
      } catch (error) {
        return {
          ...base,
          status: 'unreadable',
          error: error instanceof Error ? error.message : 'Branch history could not be read.',
        };
      }
    }));

    branches.sort((a, b) => a.status === 'sacred' ? -1 : b.status === 'sacred' ? 1 : b.unix - a.unix);
    branches.forEach((branch, index) => { branch.lane = index; });
    const [totalCommits, merges] = await Promise.all([
      count(repoDir, ['rev-list', '--count', '--branches']),
      count(repoDir, ['rev-list', '--count', '--merges', '--branches']),
    ]);

    markStage('building result');
    const readableBranches = branches.filter((branch) => branch.status !== 'unreadable');
    return {
      repo: `${owner}/${name}`,
      defaultBranch,
      branchesFound: refs.length,
      branchesRendered: readableBranches.length,
      totalCommits,
      sampled: totalCommits > trunk.length,
      stages,
      stats: {
        branches: readableBranches.length,
        merges,
        absorbed: readableBranches.filter((branch) => branch.status === 'absorbed').length,
        pruned: readableBranches.filter((branch) => branch.status === 'pruned').length,
        active: readableBranches.filter((branch) => branch.status === 'active').length,
      },
      trunk,
      branches,
      scannedAt: new Date().toISOString(),
    };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

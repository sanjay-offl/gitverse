import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const options = { maxBuffer: 256 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } };
export async function git(cwd, args) { return (await run('git', ['-c', 'safe.bareRepository=all', ...args], { ...options, cwd })).stdout.trim(); }
export async function isAncestor(cwd, a, b) {
  try { await git(cwd, ['merge-base', '--is-ancestor', a, b]); return true; } catch { return false; }
}
export async function cloneBare(url, dir) {
  try { await run('git', ['clone', '--bare', '--filter=blob:none', '--quiet', url, dir], options); }
  catch { await run('git', ['clone', '--bare', '--quiet', url, dir], options); }
}

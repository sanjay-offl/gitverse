const REPO_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;
export function parseRepoUrl(input) {
  const match = String(input || '').trim().match(REPO_RE);
  return match ? { owner: match[1], name: match[2], cloneUrl: `https://github.com/${match[1]}/${match[2]}.git` } : null;
}

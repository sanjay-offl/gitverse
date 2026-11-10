# GitVerse

GitVerse maps a GitHub repository's default branch and every other branch into a cinematic timeline tree.

## Setup

Git must be installed:

```bash
git --version
```

Then run:

```bash
npm install
npm start
```

Open `http://127.0.0.1:5173`.

Available scripts:

- `npm run dev` — Vite frontend
- `npm run server` — Express API on `127.0.0.1:3001`
- `npm start` — API and frontend together
- `npm run build` — production frontend build

## How it works

1. The server validates the GitHub URL and creates a temporary bare clone.
2. Git refs are read from `refs/heads`, so every branch is included.
3. The default branch becomes the Sacred Timeline; fork points and branch-only commits are calculated from the DAG.
4. The frontend lays out the trunk vertically and alternates branch lanes around it.
5. GSAP, ScrollTrigger, and Lenis animate the tree and branch index.

## Limits and assumptions

- The trunk renders up to 400 first-parent commits.
- Each non-default branch renders up to 120 branch-only commits.
- Scan results are cached in memory for 24 hours.
- Universe numbers use the first six SHA characters modulo 10,000.
- A branch is absorbed when its tip is an ancestor of the default branch, pruned after 90 days of inactivity, and active otherwise.
- No repository code is stored; temporary clones are removed in a `finally` block.

GitVerse is a fan-inspired project and is not affiliated with Marvel Studios or Disney.

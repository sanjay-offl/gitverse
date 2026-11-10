import express from 'express';
import cors from 'cors';
import { TtlCache } from './lib/cache.js';
import { parseRepoUrl } from './lib/repoUrl.js';
import { ScanError, scanRepo } from './lib/scan.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const cache = new TtlCache(24 * 60 * 60 * 1000);
app.use(cors({ origin: [/^http:\/\/127\.0\.0\.1(:\d+)?$/, /^http:\/\/localhost(:\d+)?$/] }));
app.use(express.json({ limit: '10kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/scan', async (req, res) => {
  const repo = parseRepoUrl(req.body?.url);
  if (!repo) return res.status(400).json({ error: 'Enter a valid URL like https://github.com/owner/repo' });
  const key = `${repo.owner}/${repo.name}`.toLowerCase();
  const cached = cache.get(key);
  if (cached) return res.json({ ...cached, cached: true });
  try {
    const data = await scanRepo(repo);
    cache.set(key, data);
    return res.json({ ...data, cached: false });
  } catch (error) {
    if (error instanceof ScanError) return res.status(422).json({ error: error.message, code: error.code });
    console.error('Scan failed:', error);
    return res.status(500).json({ error: 'Scan failed (500). Please try again.' });
  }
});
app.listen(port, '127.0.0.1', () => console.log(`GitVerse API running at http://127.0.0.1:${port}`));

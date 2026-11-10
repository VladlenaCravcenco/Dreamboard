import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { shareHtml } from '../server/shareHtml.mjs';
export default async function handler(req, res) {
  const path = typeof req.query.path === 'string' ? `/${req.query.path}` : '';
  try {
    const html = shareHtml(await readFile(join(process.cwd(), 'dist/app.html'), 'utf8'), path);
    if (!html) return res.status(404).send('Ссылка не найдена');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).send(html);
  } catch {
    return res.status(503).send('Не удалось открыть страницу. Попробуйте ещё раз.');
  }
}

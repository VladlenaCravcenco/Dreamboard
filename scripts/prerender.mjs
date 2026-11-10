// Runs after `vite build`.
// - dist/app.html: the plain SPA shell, served for every app route (noindex).
// - dist/index.html: the same shell with the guest landing prerendered into #root,
//   served for "/" so search engines get real content without running JavaScript.
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { publicOrigin } from '../src/app/lib/shareMetadata.mjs';

const shell = await readFile('dist/index.html', 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to prerender into');

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', cacheDir: join(tmpdir(), 'dreamboard-prerender-vite'), optimizeDeps: { noDiscovery: true, include: [] } });
let body;
try {
  const { renderLanding } = await vite.ssrLoadModule('/src/app/prerender.tsx');
  body = renderLanding();
} finally {
  await vite.close();
}

await writeFile('dist/app.html', shell.replace('</head>', '  <meta name="robots" content="noindex">\n</head>'));
await writeFile('dist/index.html', shell
  .replace('</head>', `  <link rel="canonical" href="${publicOrigin}/">\n  <meta property="og:url" content="${publicOrigin}/">\n</head>`)
  .replace('<div id="root"></div>', `<div id="root"><div data-prerendered>${body}</div></div>`));
console.log(`Prerendered landing into dist/index.html (${body.length} chars); SPA shell in dist/app.html`);

import { build } from 'esbuild';
import { mkdir, writeFile, copyFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = '/tmp/dreamboard-qa';
await mkdir(out, { recursive: true });
await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import App from './src/app/App.tsx'; createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, outfile: `${out}/app.js`, format: 'esm', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'isolated-backend', setup(build) { build.onResolve({ filter: /(?:\/lib\/supabase|^\.\/supabase)$/ }, () => ({ path: resolve('tests/fixtures/supabase.ts') })); } }],
});
const css = (await readdir('dist/assets')).find(name => name.endsWith('.css'));
await copyFile(`dist/assets/${css}`, `${out}/app.css`);
await copyFile('public/icon-512.png', `${out}/icon-512.png`);
await copyFile('public/dream-placeholder.svg', `${out}/dream-placeholder.svg`);
await writeFile(`${out}/index.html`, '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dreamboard — локальный тест</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
console.log(`Isolated preview built in ${out}`);

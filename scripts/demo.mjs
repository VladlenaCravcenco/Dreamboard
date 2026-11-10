// `npm run demo`: a local, offline demo of Dreamboard with example data — no account, no Supabase.
// Opens the page a friend sees when you share your wishlist (example friend "Саша").
// Builds into temp folders, so the tracked dist/ stays untouched.
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, createServer } from 'vite';

const dist = join(tmpdir(), 'dreamboard-demo-dist');
await build({ logLevel: 'warn', build: { outDir: dist, emptyOutDir: true } });
const preview = spawnSync(process.execPath, ['tests/build-preview.mjs'], { stdio: 'inherit', env: { ...process.env, DREAMBOARD_DIST: dist } });
if (preview.status !== 0) process.exit(preview.status ?? 1);

const friendPage = '/invite/40000000-0000-0000-0000-000000000001';
const server = await createServer({
  configFile: false,
  root: '/tmp/dreamboard-qa',
  appType: 'spa',
  server: { port: 5180, host: true, allowedHosts: true, open: process.env.CI ? false : friendPage },
});
await server.listen();
const base = `http://localhost:${server.config.server.port}`;
console.log(`
  Демо Dreamboard с примерами (без аккаунта):
  ➜ Как друг видит список желаний:  ${base}${friendPage}
  ➜ Моя доска:                      ${base}/
  Данные хранятся только в этом браузере. Остановить: Ctrl+C
`);

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareHtml } from '../server/shareHtml.mjs';
import { publicShareUrl } from '../src/app/lib/shareMetadata.mjs';
const template = '<html><head><title>Old</title><meta name="description" content="Old"></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
test('friend preview is in initial HTML and retains the app entry', () => {
 const result=shareHtml(template,'/u/lena');
 assert.match(result,/og:url" content="https:\/\/dreamboard-three.vercel.app\/u\/lena"/);
 assert.match(result,/og:image:width" content="1200"/);
 assert.match(result,/noindex, nofollow/);
 assert.match(result,/\/assets\/app.js/);
 assert.equal((result.match(/name="description"/g)||[]).length,1);
});
test('legacy links work, malformed and injectable paths are rejected', () => {
 assert.ok(shareHtml(template,'/invite/40000000-0000-0000-0000-000000000001'));
 for(const path of ['/u/<script>','/u/name?x="','//evil.test','/profile','/u/../../x'])assert.equal(shareHtml(template,path),null);
});
test('copied links always use the public origin',()=>assert.equal(publicShareUrl('/u/lena'),'https://dreamboard-three.vercel.app/u/lena'));

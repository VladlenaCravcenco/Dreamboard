import test from 'node:test';
import assert from 'node:assert/strict';
import {publicIPv4,validProductUrl,metadata} from '../api/product-preview.mjs';
test('preview blocks non-web protocols, credentials, local hosts and alternate ports',()=>{
 for(const url of ['http://example.com','file:///etc/passwd','https://user:pass@example.com','https://localhost','https://router.local','https://host.internal','https://example.com:8080'])assert.throws(()=>validProductUrl(url));
 assert.equal(validProductUrl('https://example.com/product#section').href,'https://example.com/product');
});
test('preview rejects private, loopback, metadata and non-IPv4 addresses',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','172.31.255.255','192.168.1.1','100.64.0.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1'])assert.equal(publicIPv4(ip),false,ip);
 assert.equal(publicIPv4('8.8.8.8'),true);assert.equal(publicIPv4('172.32.0.1'),true);
});
test('preview extracts metadata across attribute order, resolves image and falls back to title',()=>{
 assert.deepEqual(metadata(`<title>Fallback</title><meta content='Camera &amp; case' property='og:title'><meta name="twitter:image" content="/image.jpg">`,'https://example.com/item'),{title:'Camera & case',image:'https://example.com/image.jpg'});
 assert.deepEqual(metadata('<title>Tea &#x26; cups</title>','https://example.com'),{title:'Tea & cups',image:''});
 assert.equal(metadata('<meta property="og:image" content="javascript:alert(1)">','https://example.com').image,'');
});

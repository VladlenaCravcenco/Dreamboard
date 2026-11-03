import test from 'node:test';
import assert from 'node:assert/strict';
import { linkName,saveAutomaticLink } from '../src/app/lib/automaticLink.mjs';
test('readable automatic names are valid without user input',()=>{
 assert.equal(linkName('Лена'),'lena');assert.equal(linkName('Ștefan'),'stefan');
 for(const name of ['Я','🙂','   ','A'.repeat(90),'Анна Мария','---','Ілля'])assert.match(linkName(name),/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/);
});
test('a collision retries automatically with a short suffix',async()=>{
 const tried=[];const result=await saveAutomaticLink(async args=>{tried.push(args.p_slug);if(tried.length===1)throw new Error('Это имя ссылки уже занято. Попробуйте другое.');return args;},{p_name:'Лена'},null,()=> 'abc12');
 assert.deepEqual(tried,['lena','lena-abc12']);assert.equal(result.p_slug,'lena-abc12');
});
test('existing links stay stable and other errors are not retried',async()=>{
 assert.equal((await saveAutomaticLink(async a=>a,{p_name:'Новое имя'},'lena')).p_slug,'lena');
 let count=0;await assert.rejects(()=>saveAutomaticLink(async()=>{count++;throw new Error('Network error');},{p_name:'Лена'}));assert.equal(count,1);
});

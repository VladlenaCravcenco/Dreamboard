import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotStore, indexedSnapshots } from '../src/app/lib/localSnapshot.mjs';
import { PendingWrites } from '../src/app/lib/pendingWrites.mjs';
const legacy = entries => {
 const map = new Map(Object.entries(entries));
 return { getItem: key => map.get(key) ?? null, removeItem: key => map.delete(key) };
};
test('migration removes only the committed account snapshot, never pending edits', async () => {
 const old = legacy({ alice: '{"photo":"large"}', alice_pending: '{"edit":1}', bob: '{"private":1}' });
 let commit;
 const store = snapshotStore({ get: async()=>null, set: ()=>new Promise(resolve=>{commit=resolve;}) },()=>old);
 assert.deepEqual(await store.read('alice'),{photo:'large'});
 const saving=store.write('alice',{photo:'large'});
 assert.ok(old.getItem('alice'));
 commit();await saving;
 assert.equal(old.getItem('alice'),null);
 assert.ok(old.getItem('alice_pending'));assert.ok(old.getItem('bob'));
});
test('failed migration retains the old copy and can be retried', async () => {
 const old=legacy({alice:'{"title":"keep"}'});let failing=true;
 const store=snapshotStore({get:async()=>null,set:async()=>{if(failing)throw Error('quota');}},()=>old);
 await assert.rejects(store.write('alice',{}),/quota/);
 assert.deepEqual(await store.read('alice'),{title:'keep'});
 failing=false;await store.write('alice',{title:'keep'});assert.equal(old.getItem('alice'),null);
});
test('reload reads photo snapshots larger than the Web Storage limit from the database', async()=>{
 const values=new Map();const db={get:async key=>values.get(key),set:async(key,data)=>values.set(key,structuredClone(data))};
 const inaccessible=()=>{throw Error('Web Storage denied');};
 const data={image:'data:image/jpeg;base64,'+'x'.repeat(6*1024*1024)};
 await snapshotStore(db,inaccessible).write('alice',data);
 assert.deepEqual(await snapshotStore(db,inaccessible).read('alice'),data);
 assert.equal(await snapshotStore(db,inaccessible).read('bob'),null);
});
test('unavailable IndexedDB is an explicit write failure, not false success',async()=>{
 await assert.rejects(indexedSnapshots(null).set('alice',{}),/unavailable/);
});
test('quota failure does not prevent cloud saving',async()=>{
 const sent=[];const queue=new PendingWrites({storage:{getItem:()=>null,setItem:()=>{throw Error('quota');}},key:'alice',send:async row=>sent.push(row),keepInMemoryOnFailure:true});
 queue.put({id:'a',image:'large'});await queue.flush();
 assert.equal(sent.length,1);assert.deepEqual(queue.read(),{});
});
test('offline edits survive in memory after quota failure, with newest version sent on retry',async()=>{
 let offline=true;let full=true;const values=new Map();const sent=[];
 const queue=new PendingWrites({storage:{getItem:key=>values.get(key),setItem:(key,value)=>{if(full)throw Error('quota');values.set(key,value);}},key:'alice',keepInMemoryOnFailure:true,send:async row=>{if(offline)throw Error('offline');sent.push(row.title);}});
 queue.put({id:'a',title:'old'});await assert.rejects(queue.flush(),/offline/);
 queue.put({id:'a',title:'new'});assert.ok(queue.storageError);
 offline=false;full=false;await queue.flush();
 assert.deepEqual(sent,['new']);assert.deepEqual(queue.read(),{});assert.equal(queue.storageError,null);
});

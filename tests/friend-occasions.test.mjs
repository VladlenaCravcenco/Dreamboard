import test from 'node:test';
import assert from 'node:assert/strict';
import { nextBirthday, friendOccasions, daysLabel } from '../src/app/lib/friendOccasions.mjs';
test('birthday uses today or next year, without carrying a birth year',()=>{
 const now=new Date(2026,10,3,23);
 assert.equal(nextBirthday({month:11,day:3},now).getFullYear(),2026);
 assert.equal(nextBirthday({month:11,day:2},now).getFullYear(),2027);
 assert.equal(nextBirthday({month:4,day:31},now),null);
});
test('February 29 uses February 28 in a common year',()=>{
 const date=nextBirthday({month:2,day:29},new Date(2027,0,1));assert.equal(date.getDate(),28);assert.equal(date.getMonth(),1);
 assert.equal(nextBirthday({month:2,day:29},new Date(2028,0,1)).getDate(),29);
});
test('agenda merges dates, sorts them and excludes unavailable friends and past occasions',()=>{
 const friends=[{id:'a',name:'A',available:true,birthday:{month:11,day:4},preferences:{occasion:'Новоселье',occasion_date:'2026-11-03'}},{id:'b',name:'B',available:false,birthday:{month:11,day:3}},{id:'c',name:'C',available:true,preferences:{occasion:'Old',occasion_date:'2026-11-02'}}];
 const events=friendOccasions(friends,new Date(2026,10,3,23));assert.deepEqual(events.map(e=>e.days),[0,1]);assert.equal(events[0].title,'Новоселье');assert.equal(daysLabel(1),'Завтра');assert.equal(daysLabel(5),'Через 5 дней');
});

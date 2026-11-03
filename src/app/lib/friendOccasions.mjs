const dayNumber = d => Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000;
export function nextBirthday(birthday,today=new Date()) {
 if(!birthday||!Number.isInteger(birthday.month)||!Number.isInteger(birthday.day)||birthday.month<1||birthday.month>12||birthday.day<1||birthday.day>new Date(2000,birthday.month,0).getDate())return null;
 const occurrence=year=>new Date(year,birthday.month-1,Math.min(birthday.day,new Date(year,birthday.month,0).getDate()),12);
 let date=occurrence(today.getFullYear());
 if(dayNumber(date)<dayNumber(today))date=occurrence(today.getFullYear()+1);
 return date;
}
export function birthdayLabel(birthday) {
 if(!nextBirthday(birthday))return '';
 return new Date(2000,birthday.month-1,birthday.day,12).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
}
export function daysLabel(days) {
 if(days===0)return 'Сегодня';if(days===1)return 'Завтра';
 const last=days%10,teen=days%100>=11&&days%100<=14;
 return `Через ${days} ${!teen&&last===1?'день':!teen&&last>=2&&last<=4?'дня':'дней'}`;
}
export function friendOccasions(friends,today=new Date()) {
 const events=[];
 for(const friend of friends){
  if(!friend.available)continue;
  const birthday=nextBirthday(friend.birthday,today);
  if(birthday)events.push({key:`${friend.id}-birthday`,friend,date:birthday,title:'День рождения'});
  const p=friend.preferences;
  if(p?.occasion&&/^\d{4}-\d{2}-\d{2}$/.test(p.occasion_date||'')){
   const date=new Date(`${p.occasion_date}T12:00:00`);
   if(Number.isFinite(date.getTime())&&dayNumber(date)>=dayNumber(today)&&!(birthday&&dayNumber(date)===dayNumber(birthday)&&p.occasion.toLowerCase().trim()==='день рождения'))events.push({key:`${friend.id}-occasion`,friend,date,title:p.occasion});
  }
 }
 return events.map(e=>({...e,days:dayNumber(e.date)-dayNumber(today)})).sort((a,b)=>a.days-b.days||a.friend.name.localeCompare(b.friend.name,'ru'));
}

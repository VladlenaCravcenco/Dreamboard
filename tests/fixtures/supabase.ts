export const isDemoPreview = true;
// Isolated browser QA adapter. Only the preview builder imports this file.
const user = { id: 'local-preview', email: 'preview@example.test', user_metadata: { name: 'Тестовый аккаунт' } };
let rows = JSON.parse(localStorage.getItem('dreamboard_preview_rows') || '[]');
const persist = () => localStorage.setItem('dreamboard_preview_rows', JSON.stringify(rows));
export const supabase = {
  auth: {
    onAuthStateChange(callback) { queueMicrotask(() => callback('INITIAL_SESSION', { user })); return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session: { user } } }; },
    async signOut() { return { error: null }; },
    async updateUser(data) { if (data.data) user.user_metadata = data.data; return { data: { user }, error: null }; },
  },
  from() {
    return {
      select() { return { eq() { return { async order() { return { data: rows, error: null }; } }; } }; },
      async upsert(row) { rows = [...rows.filter(r => r.id !== row.id), row]; persist(); return { error: null }; },
      delete() { let id; return { eq(field, value) { if (field === 'id') id = value; return this; }, async select() { rows = rows.filter(r => r.id !== id); persist(); return { data: [{ id }], error: null }; } }; },
    };
  },
};
export async function apiCall() { throw new Error('Account deletion is disabled in the QA preview'); }

// Sharing demo stays entirely in this isolated preview (never bundled in production).
const friendId = '30000000-0000-0000-0000-000000000001';
const friendToken = '40000000-0000-0000-0000-000000000001';
const giftId = '50000000-0000-0000-0000-000000000001';
let shareSettings = JSON.parse(localStorage.getItem('qa_share_settings') || 'null');
let friendSaved = localStorage.getItem('qa_friend_saved') === 'true';
let ownBirthday=JSON.parse(localStorage.getItem('qa_birthday')||'null');
let detailRows=JSON.parse(localStorage.getItem('qa_details')||'{}');
let plans=JSON.parse(localStorage.getItem('qa_plans')||'{}');
const prefs={surprise_ok:true,interests:'Фото и керамика',occasion:'День рождения',occasion_date:'2027-01-20'};
let giftMarked = localStorage.getItem('qa_gift_marked') === 'true';
// Example "photos" for the demo wishlist: soft gradients with a simple shape (no external images).
const art = (from: string, to: string, shape: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/>${shape}</svg>`);
// First character of the id decides the tile shape on the board (even char code = round).
const friendWishes = () => [
  {id:giftId,title:'Плёночный фотоаппарат',category:'material',description:'Хочу собирать моменты на плёнке. Компактный, чтобы брать в поездки.',image:art('#f5d0c5','#e8a598','<rect x="110" y="150" width="180" height="120" rx="18" fill="#2b2b2b"/><circle cx="200" cy="210" r="42" fill="#555"/><circle cx="200" cy="210" r="26" fill="#9ad"/>'),price:150,details:{size:'Компактный',color:'Чёрный',priority:true,allow_similar:true,product_url:'https://example.com/camera'}},
  {id:'60000000-0000-0000-0000-000000000002',title:'Урок керамики',description:'Попробовать сделать чашку своими руками.',image:art('#e6dccb','#c9b79c','<path d="M140 150h120l-12 130a20 20 0 0 1-20 18h-56a20 20 0 0 1-20-18z" fill="#8a6f55"/><path d="M262 180c40 0 40 60 0 60" stroke="#8a6f55" stroke-width="14" fill="none"/>'),category:'adventure',price:45},
  {id:'70000000-0000-0000-0000-000000000003',title:'Наушники с шумоподавлением',description:'Для перелётов и работы в кафе.',image:art('#d6e4f0','#9fb8d3','<path d="M120 230v-30a80 80 0 0 1 160 0v30" stroke="#2f3b4c" stroke-width="16" fill="none"/><rect x="105" y="220" width="40" height="70" rx="14" fill="#2f3b4c"/><rect x="255" y="220" width="40" height="70" rx="14" fill="#2f3b4c"/>'),category:'material',price:280,details:{color:'Белые'}},
  {id:'80000000-0000-0000-0000-000000000004',title:'Выходные у моря',description:'Пара дней без ноутбука, где-нибудь у воды.',image:art('#ffe7b3','#7fc4d8','<circle cx="270" cy="130" r="40" fill="#ffd36b"/><path d="M0 260c60-30 120 30 200 0s140-30 200 0v140H0z" fill="#3f8fb0"/>'),category:'travel',reservation:'other'},
  {id:'90000000-0000-0000-0000-000000000005',title:'Книга «Маленькие шаги»',description:'Бумажная, в твёрдой обложке.',image:art('#e9e4f5','#b9acd9','<rect x="135" y="110" width="130" height="180" rx="10" fill="#5b4a8a"/><rect x="150" y="135" width="100" height="10" rx="5" fill="#e9e4f5"/>'),category:'personal',price:20},
  {id:'b0000000-0000-0000-0000-000000000006',title:'Сертификат в спа',description:'День заботы о себе.',image:art('#dff0e3','#a7d3b2','<circle cx="200" cy="200" r="70" fill="#5e9b6c"/><path d="M200 150c30 30 30 70 0 100c-30-30-30-70 0-100z" fill="#dff0e3"/>'),category:'style-health',price:90},
];
(supabase as any).rpc = async (name, args = {}) => {
  let data;
  if(name==='wish_board_named'||name==='wish_save_friend_named') {
    if(!shareSettings?.enabled||shareSettings.slug!==args.p_slug)return {data:null,error:{message:'Ссылка недоступна'}};
    args={p_token:shareSettings.token};name=name==='wish_board_named'?'wish_board':'wish_save_friend';
  }

  if(name==='wish_birthday')data=ownBirthday;
  else if(name==='wish_birthday_save'){ownBirthday=args.p_month?{month:args.p_month,day:args.p_day,visible:args.p_visible}:null;localStorage.setItem('qa_birthday',JSON.stringify(ownBirthday));data=ownBirthday;}
  else if(name==='wish_own_details')data=detailRows[args.p_dream_id]||{product_url:rows.find(r=>r.id===args.p_dream_id)?.product_url||''};
  else if(name==='wish_save_details'){data={product_url:args.p_url,size:args.p_size,color:args.p_color,allow_similar:args.p_similar,priority:args.p_priority};detailRows[args.p_dream_id]=data;localStorage.setItem('qa_details',JSON.stringify(detailRows));}
  else if(name==='wish_preferences'){data={surprise_ok:args.p_surprise,interests:args.p_interests,colors:args.p_colors,avoid:args.p_avoid,occasion:args.p_occasion,occasion_date:args.p_date};shareSettings.preferences=data;localStorage.setItem('qa_share_settings',JSON.stringify(shareSettings));}
  else if(name==='wish_reserve'||name==='wish_gift_plan'){const p=plans[args.p_dream_id]||{};plans[args.p_dream_id]={...p,...(name==='wish_reserve'?{reservation:args.p_reserved?'mine':'free'}:{private_note:args.p_note,gift_status:args.p_status}),marked:true};localStorage.setItem('qa_plans',JSON.stringify(plans));}
  else if (name === 'wish_settings') data = shareSettings;
  else if ((name === 'wish_configure'||name === 'wish_configure_named')) {
    shareSettings = { slug:args.p_slug||shareSettings?.slug, preferences:shareSettings?.preferences, token: shareSettings?.token || '40000000-0000-0000-0000-000000000002', display_name: args.p_name, enabled: args.p_enabled, include_future: args.p_future, dream_ids: args.p_dream_ids };
    localStorage.setItem('qa_share_settings',JSON.stringify(shareSettings)); data=shareSettings;
  } else if (name === 'wish_rotate') {
    shareSettings={...shareSettings,slug:null,enabled:false,token:crypto.randomUUID()}; localStorage.setItem('qa_share_settings',JSON.stringify(shareSettings));data=shareSettings;
  } else if (name === 'wish_friends_list') data = friendSaved ? [{id:friendId,name:'Саша',available:true,count:6,birthday:{month:11,day:8},preferences:prefs}] : [];
  else if (name === 'wish_save_friend') {friendSaved=true;localStorage.setItem('qa_friend_saved','true');data=friendId;}
  else if (name === 'wish_remove_friend') {friendSaved=false;giftMarked=false;localStorage.setItem('qa_friend_saved','false');localStorage.setItem('qa_gift_marked','false');}
  else if (name === 'wish_mark') {giftMarked=args.p_marked;localStorage.setItem('qa_gift_marked',String(giftMarked));}
  else if (name === 'wish_board') {
    if(shareSettings && args.p_token && args.p_token === shareSettings.token) data={id:'own',name:shareSettings.display_name,saved:false,is_owner:true,dreams:rows.filter(r=>!r.done&&(shareSettings.include_future||shareSettings.dream_ids.includes(r.id))).map(r=>({...r,marked:false,details:detailRows[r.id],reservation:null}))};
    else if(args.p_token===friendToken || (args.p_link_id===friendId&&friendSaved)) data={id:friendId,name:'Саша',saved:friendSaved,is_owner:false,preferences:prefs,dreams:friendWishes().map(w=>({...w,marked:w.id===giftId?giftMarked:false,...plans[w.id]}))};
    else return {data:null,error:{message:'Ссылка недоступна или доступ отключён'}};
  } else return {data:null,error:{message:'Unsupported preview RPC'}};
  return {data,error:null};
};

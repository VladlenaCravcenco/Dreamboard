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
  } else if (name === 'wish_friends_list') data = friendSaved ? [{id:friendId,name:'Саша',available:true,count:2,birthday:{month:11,day:8},preferences:prefs}] : [];
  else if (name === 'wish_save_friend') {friendSaved=true;localStorage.setItem('qa_friend_saved','true');data=friendId;}
  else if (name === 'wish_remove_friend') {friendSaved=false;giftMarked=false;localStorage.setItem('qa_friend_saved','false');localStorage.setItem('qa_gift_marked','false');}
  else if (name === 'wish_mark') {giftMarked=args.p_marked;localStorage.setItem('qa_gift_marked',String(giftMarked));}
  else if (name === 'wish_board') {
    if(shareSettings && args.p_token && args.p_token === shareSettings.token) data={id:'own',name:shareSettings.display_name,saved:false,is_owner:true,dreams:rows.filter(r=>!r.done&&(shareSettings.include_future||shareSettings.dream_ids.includes(r.id))).map(r=>({...r,marked:false,details:detailRows[r.id],reservation:null}))};
    else if(args.p_token===friendToken || (args.p_link_id===friendId&&friendSaved)) data={id:friendId,name:'Саша',saved:friendSaved,is_owner:false,preferences:prefs,dreams:[{id:giftId,title:'Плёночный фотоаппарат',category:'material',description:'Хочу собирать моменты на плёнке. Компактный, чтобы брать в поездки.',image:'/dream-placeholder.svg',price:150,marked:giftMarked,details:{size:'Компактный',color:'Чёрный',priority:true,allow_similar:true,product_url:'https://example.com/camera'},...plans[giftId]},{id:'50000000-0000-0000-0000-000000000002',title:'Урок керамики',description:'Попробовать сделать чашку своими руками.',image:'/dream-placeholder.svg',category:'adventure',price:45,marked:false,...plans['50000000-0000-0000-0000-000000000002']}]};
    else return {data:null,error:{message:'Ссылка недоступна или доступ отключён'}};
  } else return {data:null,error:{message:'Unsupported preview RPC'}};
  return {data,error:null};
};

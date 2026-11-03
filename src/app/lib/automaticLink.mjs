const letters = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',і:'i',ї:'yi',є:'ye',ґ:'g'};
export function linkName(name) {
 let value=Array.from(name.toLowerCase()).map(c=>letters[c]??c).join('').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24).replace(/-+$/,'');
 if(!value)return 'dream';
 return value.length<3?`my-${value}`:value;
}
export async function saveAutomaticLink(save,values,existingSlug,random=()=>crypto.randomUUID().replace(/-/g,'').slice(0,5)) {
 const base=linkName(values.p_name);
 for(let attempt=0;attempt<8;attempt++){
  const slug=existingSlug||(attempt?`${base}-${random()}`:base);
  try{return await save({...values,p_slug:slug});}
  catch(error){if(existingSlug||!error.message?.includes('Это имя ссылки уже занято'))throw error;}
 }
 throw new Error('Не удалось создать ссылку. Попробуйте сохранить ещё раз.');
}

import https from 'node:https';
import { resolve4 } from 'node:dns/promises';
import { isIP } from 'node:net';

export function publicIPv4(ip) {
  if(isIP(ip)!==4)return false;
  const [a,b]=ip.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0))||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19||b===51))||(a===203&&b===0));
}
export function validProductUrl(value) {
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal'))throw new Error('Нужна публичная HTTPS-ссылка на товар');
  u.hash='';return u;
}
const decode = s => s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';}).replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
export function metadata(html,base) {
  const tags={};
  for(const tag of html.match(/<meta\b[^>]*>/gi)||[]) {
    const attrs={};
    for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[m[1].toLowerCase()]=decode(m[2]??m[3]??m[4]);
    const key=(attrs.property||attrs.name||'').toLowerCase();if(attrs.content)tags[key]=attrs.content;
  }
  const title=decode(tags['og:title']||tags['twitter:title']||(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'')).replace(/<[^>]*>/g,'').trim().slice(0,160);
  let image='';const source=tags['og:image']||tags['twitter:image'];if(source)try{image=validProductUrl(new URL(source,base).href).href;}catch{}
  return {title,image};
}
async function fetchPage(input,hops=0) {
  const url=validProductUrl(input);
  const ips=await resolve4(url.hostname);
  if(!ips.length||!ips.every(publicIPv4))throw new Error('Этот адрес недоступен');
  // Pin the vetted DNS address; a second resolution cannot redirect into a private network.
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{lookup:(_host,options,callback)=>options.all?callback(null,[{address:ips[0],family:4}]):callback(null,ips[0],4),headers:{'User-Agent':'Dreamboard-LinkPreview/1.0','Accept':'text/html'}},res=>{
      if([301,302,303,307,308].includes(res.statusCode)){
        res.resume();if(hops>=3||!res.headers.location){reject(new Error('Слишком много перенаправлений'));return;}
        fetchPage(new URL(res.headers.location,url).href,hops+1).then(resolve,reject);return;
      }
      if(res.statusCode!==200||!String(res.headers['content-type']).includes('text/html')){res.resume();reject(new Error('Магазин не разрешил загрузку превью'));return;}
      let bytes=0;const chunks=[];
      res.on('data',chunk=>{bytes+=chunk.length;if(bytes>1024*1024){res.destroy();reject(new Error('Страница слишком большая'));}else chunks.push(chunk);});
      res.on('error',reject);res.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),url:url.href}));
    });
    const timer=setTimeout(()=>req.destroy(new Error('Магазин отвечает слишком долго')),6000);
    req.on('close',()=>clearTimeout(timer));req.on('error',reject);
  });
}
const recent=new Map();
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try {
    const authorization=req.headers.authorization;
    if(!authorization?.startsWith('Bearer '))return res.status(401).json({error:'Войдите в аккаунт'});
    const auth=await fetch('https://tbtzzpnshhsmpvyjjiyf.supabase.co/auth/v1/user',{headers:{Authorization:authorization,apikey:'sb_publishable_uDFC6WJwcOuIjeOk2WKTgg_rbEIdEGf'},signal:AbortSignal.timeout(5000)});
    if(!auth.ok)return res.status(401).json({error:'Войдите в аккаунт'});
    const user=await auth.json();const now=Date.now();
    for(const [key,value] of recent)if(now-value>60000)recent.delete(key);
    if(now-(recent.get(user.id)||0)<2000)return res.status(429).json({error:'Подождите пару секунд'});
    recent.set(user.id,now);
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(typeof body?.url!=='string'||body.url.length>2000)throw new Error('Проверьте ссылку');
    const page=await fetchPage(body.url);const result=metadata(page.html,page.url);
    if(result.image){try{const ips=await resolve4(new URL(result.image).hostname);if(!ips.length||!ips.every(publicIPv4))result.image='';}catch{result.image='';}}
    if(!result.title&&!result.image)throw new Error('Не удалось найти название или фото. Заполните их вручную.');
    return res.status(200).json(result);
  } catch(e) {return res.status(422).json({error:e instanceof Error?e.message:'Не удалось получить превью'});}
}

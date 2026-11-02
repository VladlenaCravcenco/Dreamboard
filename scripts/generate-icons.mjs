// Render the existing UI pixel spark without resampling or external dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const source = readFileSync('src/app/components/PixelIcons.tsx', 'utf8');
const pattern = [...source.match(/spark: \[(.*?)\]/)[1].matchAll(/'([01]+)'/g)].map(m => m[1]);
const pixels = pattern.flatMap((row,y) => [...row].flatMap((v,x) => v === '1' ? [[x,y]] : []));
const svg = (mask = false, mono = false) => {
  const cell = mask ? 8 : 9, offset = (100-cell*7)/2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${mono ? '' : '<rect width="100" height="100" fill="#111111"/>'}<g fill="${mono ? '#000000' : '#ffffff'}" shape-rendering="crispEdges">${pixels.map(([x,y]) => `<rect x="${offset+x*cell}" y="${offset+y*cell}" width="${cell}" height="${cell}"/>`).join('')}</g></svg>\n`;
};
function crc32(bytes) {
  let c=0xffffffff;
  for (const byte of bytes) { c ^= byte; for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0); }
  return (c^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type), length=Buffer.alloc(4), crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([length,name,data,crc]);
}
function png(size,{mask=false,badge=false}={}) {
  const cell=Math.max(1,Math.floor(size*(mask?.08:.09))), offset=Math.floor((size-cell*7)/2);
  const rows=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const px=Math.floor((x-offset)/cell), py=Math.floor((y-offset)/cell);
    const on=px>=0&&px<7&&py>=0&&py<7&&pattern[py][px]==='1';
    const i=y*(size*4+1)+1+x*4;
    rows[i]=rows[i+1]=rows[i+2]=on?255:17; rows[i+3]=badge&&!on?0:255;
  }
  const header=Buffer.alloc(13); header.writeUInt32BE(size,0); header.writeUInt32BE(size,4); header[8]=8; header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
for(const size of [16,32,48,180,192,512,1024]) writeFileSync(`public/icon-${size}.png`,png(size));
writeFileSync('public/icon.png',png(512));
writeFileSync('public/apple-touch-icon.png',png(180));
writeFileSync('public/icon-maskable-512.png',png(512,{mask:true}));
writeFileSync('public/badge-96.png',png(96,{badge:true}));
writeFileSync('public/icon.svg',svg());
writeFileSync('public/icon-maskable.svg',svg(true));
writeFileSync('public/safari-pinned-tab.svg',svg(false,true));
const sizes=[16,32,48], images=sizes.map(s=>png(s)), header=Buffer.alloc(6);
header.writeUInt16LE(1,2); header.writeUInt16LE(sizes.length,4);
let offset=6+sizes.length*16;
const entries=images.map((image,i)=>{const e=Buffer.alloc(16);e[0]=e[1]=sizes[i];e.writeUInt16LE(1,4);e.writeUInt16LE(32,6);e.writeUInt32LE(image.length,8);e.writeUInt32LE(offset,12);offset+=image.length;return e;});
writeFileSync('public/favicon.ico',Buffer.concat([header,...entries,...images]));
console.log('Generated SVG, ICO, PNG 16–1024, Apple, maskable and notification badge icons.');

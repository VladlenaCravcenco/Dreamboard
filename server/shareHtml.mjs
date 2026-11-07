import { publicOrigin, shareTitle, shareDescription, shareImagePath } from '../src/app/lib/shareMetadata.mjs';
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function shareHtml(html, path) {
  if (!/^\/(?:u\/[a-z0-9][a-z0-9-]{1,63}|invite\/[0-9a-f-]{36})\/?$/.test(path)) return null;
  const url = publicOrigin + path.replace(/\/$/, '');
  return html.replace(/<title>[^<]*<\/title>/, `<title>${shareTitle}</title>`)
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace('</head>', `<meta name="description" content="${escape(shareDescription)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dreamboard">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${shareTitle}">
<meta property="og:description" content="${shareDescription}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${publicOrigin}${shareImagePath}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Dreamboard — подарки, о которых мечтают">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${shareTitle}">
<meta name="twitter:description" content="${shareDescription}">
<meta name="twitter:image" content="${publicOrigin}${shareImagePath}">
</head>`);
}

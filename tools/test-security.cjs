const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
let pages=0;
for(const f of walk(root).filter(f=>f.endsWith('.html'))){const s=fs.readFileSync(f,'utf8');if(!/<head>/i.test(s))continue;const c=s.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];assert(c,f);assert(c.includes("object-src 'none'"));assert(c.includes("base-uri 'none'"));assert(!c.split('script-src ')[1].split(';')[0].includes('unsafe-'));assert(!/\son\w+=/i.test(s),f);for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc=/.test(m[1]))continue;assert(c.includes(crypto.createHash('sha256').update(m[2]).digest('base64')),f);}pages++;}
const p=fs.readFileSync(root+'/assets/js/platform.js','utf8');
const editor=p.slice(p.indexOf(' function quoteEditor'),p.indexOf(' function uploadPanel'));
assert(!editor.includes('pricing_snapshot'));assert(!editor.includes('msRegional'));
for(const f of walk(root+'/assets/js'))assert(!/innerHTML|outerHTML|insertAdjacentHTML|\beval\(/.test(fs.readFileSync(f,'utf8')),f);
console.log('PASS: '+pages+' pages enforce CSP; inline hashes match; no inline event handlers or unsafe DOM sinks; staff quotes ignore customer pricing.');



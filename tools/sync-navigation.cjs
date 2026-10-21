const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const header=fs.readFileSync(path.join(root,'partials/header.html'),'utf8'),footer=fs.readFileSync(path.join(root,'partials/footer.html'),'utf8');
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f));
for(const file of pages){const full=path.join(root,file);let html=fs.readFileSync(full,'utf8');if(!html.includes('<main'))continue;const prefix=file.startsWith('blog/')?'../':'',active=file.startsWith('blog/')?'blog/index.html':file;let nav=header.replaceAll('{{base}}',prefix);nav=nav.replaceAll('href="'+prefix+active+'"','href="'+prefix+active+'" aria-current="page"');html=html.replace(/<header[\s\S]*?<\/header>/,nav).replace(/<footer[\s\S]*?<\/footer>/,footer.replaceAll('{{base}}',prefix));fs.writeFileSync(full,html);}
console.log('Shared navigation and footer synchronised.');

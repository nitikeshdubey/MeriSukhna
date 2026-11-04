(() => {
 const node=document.getElementById('heroTypewriter'),control=document.getElementById('headlineMotion');if(!node||!control)return;
 const phrases=[{lang:'pa',text:'ਆਪਣੀ ਸੁੱਖਣਾ ਪੂਰੀ ਕਰੋ।'},{lang:'en',text:'Fulfil your Sukhna.'}];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const segment=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('pa',{granularity:'grapheme'}).segment(text)].map(x=>x.segment):Array.from(text);
 let index=0,position=segment(phrases[0].text).length,deleting=true,timer,paused=motion.matches;
 function schedule(delay){clearTimeout(timer);if(!paused&&!document.hidden)timer=setTimeout(tick,delay);}
 function tick(){const phrase=phrases[index],letters=segment(phrase.text);position+=deleting?-1:1;node.lang=phrase.lang;node.textContent=letters.slice(0,position).join('');if(position===0){index=(index+1)%phrases.length;deleting=false;schedule(350);}else if(position===letters.length){deleting=true;schedule(3200);}else schedule(deleting?48:100);}
 function paint(){clearTimeout(timer);control.hidden=false;control.textContent=paused?'Resume headline':'Pause headline';control.setAttribute('aria-pressed',String(paused));node.closest('h1').classList.toggle('type-paused',paused);if(paused&&motion.matches){node.lang='en';node.textContent=phrases[1].text;}else schedule(3200);}
 control.addEventListener('click',()=>{paused=!paused;if(!paused){index=0;position=segment(phrases[0].text).length;deleting=true;node.lang='pa';node.textContent=phrases[0].text;}paint();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else schedule(1200);});
 motion.addEventListener('change',()=>{paused=motion.matches;paint();});paint();
})();

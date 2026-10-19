(() => {
 const toggle=document.getElementById('musicToggle'),volume=document.getElementById('musicVolume');if(!toggle)return;
 const audio=document.createElement('audio');audio.preload='none';audio.loop=true;audio.volume=Number(volume.value)/100;audio.setAttribute('aria-label','Kirtan at Gurdwara Ontario Khalsa Darbar');document.querySelector('.music-player').append(audio);
 const source='https://upload.wikimedia.org/wikipedia/commons/c/c3/Video_of_a_kirtan_performance_at_Gurdwara_Ontario_Khalsa_Darbar_in_Mississauga%2C_Ontario%2C_Canada%2C_2_March_2026.webm';
 function paint(){toggle.textContent=audio.paused?'♫ Play kirtan':'Ⅱ Pause kirtan';toggle.setAttribute('aria-pressed',String(!audio.paused));}
 async function play(){if(!document.documentElement.classList.contains('region-allowed'))return;if(!audio.src)audio.src=source;toggle.textContent='Loading kirtan…';try{await audio.play();paint();}catch{toggle.textContent='♫ Play kirtan';toggle.setAttribute('aria-pressed','false');}}
 toggle.addEventListener('click',()=>{if(audio.paused)play();else{audio.pause();paint();}});
 volume.addEventListener('input',()=>audio.volume=Number(volume.value)/100);
 audio.addEventListener('play',paint);audio.addEventListener('pause',paint);audio.addEventListener('error',()=>{toggle.textContent='Kirtan unavailable · Retry';toggle.setAttribute('aria-pressed','false');audio.removeAttribute('src');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.pause();paint();}});
 let attempted=false;function check(){if(!attempted&&document.documentElement.classList.contains('region-allowed')){attempted=true;observer.disconnect();play();}}const observer=new MutationObserver(check);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});check();paint();
})();
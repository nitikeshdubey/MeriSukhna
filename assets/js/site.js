
    const REQUEST_URL = 'https://wa.me/919888188114';
    const INSTAGRAM_URL = 'https://instagram.com/merisukhna';
  

    document.querySelectorAll('[data-request]').forEach(el => {
      el.href = REQUEST_URL;
      if (el.classList.contains('wa-float')) el.setAttribute('aria-label','Chat with MERI SUKHNA on WhatsApp');
    });
    document.querySelectorAll('[data-instagram]').forEach(el => el.href = INSTAGRAM_URL);


    // Native dialog supplies modal focus management and Escape dismissal.
    const welcomeDialog = document.getElementById('welcomeDialog');
    const quickHelp = document.getElementById('quickHelp');
    let welcomeTimer;
    function rememberWelcome(){clearTimeout(welcomeTimer);try{sessionStorage.setItem('meriSukhnaWelcomeSeen','yes');}catch{}}
    function openWelcome(){rememberWelcome();if(typeof welcomeDialog.showModal==='function'&&!welcomeDialog.open)welcomeDialog.showModal();else if(typeof welcomeDialog.showModal!=='function')location.hash='request';}
    quickHelp.addEventListener('click',openWelcome);
    document.getElementById('closeWelcome').addEventListener('click',()=>welcomeDialog.close());
    document.getElementById('laterWelcome').addEventListener('click',()=>welcomeDialog.close());
    welcomeDialog.addEventListener('close',rememberWelcome);
    welcomeDialog.addEventListener('cancel',rememberWelcome);
    document.getElementById('popupRequest').addEventListener('click',()=>{welcomeDialog.close();});
    let welcomeSeen=false;try{welcomeSeen=!!sessionStorage.getItem('meriSukhnaWelcomeSeen');}catch{welcomeSeen=true;}
    if(!welcomeSeen)welcomeTimer=setTimeout(()=>{if(!document.hidden&&!document.querySelector('input:focus,textarea:focus,select:focus')&&location.hash!=='#request')openWelcome();},12000);
    document.querySelectorAll('[data-request]').forEach(el=>el.addEventListener('click',rememberWelcome));

    // Header scroll state
    const header = document.getElementById('siteHeader');
    const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 18);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    // Mobile menu
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    menuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.focus();
      }
    });

  
// Homepage photographs: random order, five-second cadence, progressive loading.
(() => {
 const slides=[{"src":"https://commons.wikimedia.org/wiki/Special:FilePath/Sarovar%20and%20the%20Golden%20Temple.jpg?width=1000","alt":"Sri Harmandir Sahib (Golden Temple), Amritsar","name":"Sri Harmandir Sahib (Golden Temple)","place":"Amritsar"},{"src":"https://upload.wikimedia.org/wikipedia/commons/1/17/The_Sarovar_besides_the_GurudwaraTarn_Taran_Sahib%2C_Punjab%2C_India.jpg","alt":"Gurdwara Sri Tarn Taran Sahib","name":"Gurdwara Sri Tarn Taran Sahib","place":"Tarn Taran"},{"src":"https://upload.wikimedia.org/wikipedia/commons/a/a1/Ber_Sahib.jpg","alt":"Gurdwara Ber Sahib, Sultanpur Lodhi","name":"Gurdwara Sri Ber Sahib","place":"Sultanpur Lodhi"},{"src":"https://upload.wikimedia.org/wikipedia/commons/5/53/Takhat_Sri_Kesgarh_Sahib%2C_Anandpur_Sahib_03.jpg","alt":"Takht Sri Kesgarh Sahib, Anandpur Sahib","name":"Takht Sri Kesgarh Sahib","place":"Sri Anandpur Sahib"}];
 const carousel=document.getElementById('heroCarousel');if(!carousel)return;
 const caption=document.getElementById('heroCaption');const controls=carousel.querySelector('.hero-carousel-controls');
 const dots=[...carousel.querySelectorAll('.hero-dot')],pause=carousel.querySelector('.hero-pause');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let current=0,timer=null,busy=false,paused=motion.matches,hovered=false,focused=false,bag=[],sequence=0;
 const loaded=new Map([[0,carousel.querySelector('img')]]);
 controls.hidden=false;
 function load(index){if(loaded.has(index))return Promise.resolve(loaded.get(index));return new Promise((resolve,reject)=>{const img=new Image();img.alt=slides[index].alt;img.decoding='async';img.onload=()=>{loaded.set(index,img);resolve(img);};img.onerror=reject;img.src=slides[index].src;});}
 function shuffleNext(){if(!bag.length){bag=slides.map((_,i)=>i).filter(i=>i!==current);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}return bag.pop();}
 function sync(){pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');clearInterval(timer);timer=null;if(!paused&&!hovered&&!focused&&!document.hidden)timer=setInterval(()=>show(shuffleNext()),5000);}
 async function show(index){if(index===current||busy)return;busy=true;const ticket=++sequence;try{const image=await load(index);if(ticket!==sequence)return;const previous=carousel.querySelector('img.slide-active')||carousel.querySelector('img');image.className='slide-incoming';carousel.insertBefore(image,caption);requestAnimationFrame(()=>requestAnimationFrame(()=>{image.className='slide-active';if(previous!==image)previous.className='slide-outgoing';}));current=index;caption.querySelector(':scope > span').textContent=slides[index].name;caption.querySelector(':scope > strong').textContent=slides[index].place;carousel.querySelector('.hero-slide-count').textContent=String(index+1).padStart(2,'0')+' / 04';dots.forEach((dot,i)=>{dot.classList.toggle('active',i===index);dot.setAttribute('aria-pressed',String(i===index));});setTimeout(()=>{if(previous!==image)previous.remove();busy=false;},motion.matches?0:1050);}catch{busy=false;}}
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>{bag=[];show(i);sync();}));
 carousel.querySelector('.hero-next').addEventListener('click',()=>{show(shuffleNext());sync();});
 pause.addEventListener('click',()=>{paused=!paused;sync();});
 carousel.addEventListener('mouseenter',()=>{hovered=true;sync();});carousel.addEventListener('mouseleave',()=>{hovered=false;sync();});
 carousel.addEventListener('focusin',()=>{focused=true;sync();});carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget)){focused=false;sync();}});
 document.addEventListener('visibilitychange',sync);motion.addEventListener('change',()=>{paused=motion.matches;sync();});
 carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(shuffleNext());sync();}});
 sync();
})();

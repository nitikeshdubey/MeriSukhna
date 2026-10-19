
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

  
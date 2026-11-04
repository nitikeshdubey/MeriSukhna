(() => {
 const lang='en';window.MS_I18N={language:'en',t:text=>text,translate(){}};
 const menu=document.getElementById('msMobileMenu'),button=document.getElementById('msMenuButton');
 function close(focus=false){menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open menu');button.textContent='☰';document.body.classList.remove('ms-menu-open');if(focus)button.focus();}
 button?.addEventListener('click',()=>{if(!menu.hidden){close();return;}menu.hidden=false;button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','Close menu');button.textContent='×';document.body.classList.add('ms-menu-open');});
 menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>close()));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!menu.hidden)close(true);document.querySelectorAll('.ms-resources[open]').forEach(x=>x.open=false);}});
 document.addEventListener('click',e=>document.querySelectorAll('.ms-resources[open]').forEach(x=>{if(!x.contains(e.target))x.open=false;}));
 matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)close();});
 const motion=matchMedia('(prefers-reduced-motion:reduce)');if(!motion.matches&&'IntersectionObserver'in window){document.body.classList.add('ms-motion');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('ms-visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.ms-reveal').forEach(el=>observer.observe(el));}
 const search=document.getElementById('guideSearch');function filter(){const q=search.value.trim().toLowerCase();let count=0;document.querySelectorAll('[data-guide]').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(q);if(!card.hidden)count++;});document.getElementById('guideCount').textContent=count+(lang==='pa'?' Gurudwara Sahib':' Gurudwara Sahibs');}if(search){search.addEventListener('input',filter);filter();}
 if(!document.getElementById('customForm'))return;
 const form=document.getElementById('customForm'),draftKey='ms-package-draft-v1',draftStatus=document.getElementById('draftStatus');
 const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());form.elements.date.min=today.toISOString().slice(0,10);
 const message=text=>draftStatus.textContent=window.MS_I18N.t(text);
 function sanitise(s){if(!s||!['Basic','Plus','Complete'].includes(s.package))throw new Error('Invalid saved package.');return {package:s.package,place:String(s.place||'').slice(0,180),paath:String(s.paath||'').slice(0,180),additions:Array.isArray(s.additions)?s.additions.filter(v=>['Rumala Sahib','Deg / Karah Prashad','Ardaas','Langar seva','Food / fruit distribution','Live video call'].includes(v)):[],date:s.package==='Complete'&&/^\d{4}-\d{2}-\d{2}$/.test(s.date||'')?s.date:'',notes:''};}
 function restore(s){const state=sanitise(s);familyPreferences.restore(s.notes);form.elements.package.value=state.package;const place=form.elements.gurdwara;if([...place.options].some(o=>o.value===state.place)){place.value=state.place;form.elements.otherPlace.value='';}else{place.value=state.place?'Other':'';form.elements.otherPlace.value=state.place;}document.getElementById('addPaath').checked=!!state.paath&&state.paath!=='No additional Paath requested';if([...form.elements.paath.options].some(o=>o.value===state.paath))form.elements.paath.value=state.paath;form.querySelectorAll('[name=addition]').forEach(c=>c.checked=state.additions.includes(c.value));form.elements.date.value=state.date;form.dispatchEvent(new Event('change',{bubbles:true}));}
 const incoming=new URLSearchParams(location.search).get('gurdwara');if(incoming)restore({...getState(),place:incoming});
 // Restore non-sensitive selections within this tab; notes stay unsaved.
 try{const saved=JSON.parse(sessionStorage.getItem('ms-session-draft'));if(saved&&!location.search)restore(saved);}catch{}
 form.addEventListener('change',()=>{try{sessionStorage.setItem('ms-session-draft',JSON.stringify(sanitise(getState())));}catch{}});
 document.getElementById('saveDevice').onclick=()=>{try{localStorage.setItem(draftKey,JSON.stringify({savedAt:Date.now(),selection:sanitise(getState())}));message('Package saved on this device, without notes.');}catch{message('This browser could not save your package.');}};
 document.getElementById('restoreDevice').onclick=()=>{try{const data=JSON.parse(localStorage.getItem(draftKey));if(!data||Date.now()-data.savedAt>30*86400000)throw new Error('No recent saved package found.');restore(data.selection);message('Saved package restored.');}catch(error){message(error.message);}};
 document.getElementById('clearDevice').onclick=()=>{try{localStorage.removeItem(draftKey);sessionStorage.removeItem('ms-session-draft');message('Saved device package cleared.');}catch{message('Could not clear browser storage.');}};
 document.getElementById('saveAccountDraft').onclick=async()=>{try{if(!MS_API.user)throw new Error('Sign in from My requests first.');const selection=getState();if(selection.notes.length>1200)throw new Error('Shorten the family preferences and notes to 1,200 characters before saving.');await MS_API.rpc('save_draft',{selection});message('Private account draft saved.');}catch(e){message(e.message);}};
 document.getElementById('restoreAccountDraft').onclick=async()=>{try{if(!MS_API.user)throw new Error('Sign in from My requests first.');const drafts=await MS_API.table('ms_drafts','select=selection');if(!drafts.length)throw new Error('No account draft found.');restore(drafts[0].selection);form.dispatchEvent(new Event('change',{bubbles:true}));message('Private account draft restored.');}catch(e){message(e.message);}};
 document.getElementById('saveTrackedRequest').onclick=async function(){if(window.validatePackage&&!window.validatePackage())return;const state=getState();if(!state.place){message('Choose your Gurudwara Sahib first.');return;}this.disabled=true;try{if(!MS_API.configured)throw new Error('Secure accounts are awaiting backend connection. You can still customise a package and contact us on WhatsApp.');if(!MS_API.user){sessionStorage.setItem('ms-pending-request',JSON.stringify(state));location.href='/account';return;}const id=await MS_API.rpc('create_request',{selection:state});sessionStorage.setItem('ms-created-request',id);location.href='/account#'+id;}catch(e){message(e.message);document.getElementById('formStatus').textContent=e.message;}finally{this.disabled=false;}};
})();

(() => {
  const main = document.getElementById('mainContent');
  if (!main) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'reading-tools';
  toolbar.setAttribute('aria-label', 'Reading options');
  const size = document.createElement('button');
  size.type = 'button';
  size.textContent = 'Large text';
  const apply = enabled => {
    document.documentElement.classList.toggle('large-reading', enabled);
    size.setAttribute('aria-pressed', String(enabled));
  };
  let enabled = false;
  try { enabled = localStorage.getItem('ms-large-reading') === 'true'; } catch {}
  apply(enabled);
  size.addEventListener('click', () => {
    const next = size.getAttribute('aria-pressed') !== 'true';
    apply(next);
    try { localStorage.setItem('ms-large-reading', String(next)); } catch {}
  });
  const glossary = document.createElement('a');
  glossary.href = '/faq#punjabiGlossary';
  glossary.textContent = 'Punjabi glossary';
  toolbar.append(size, glossary);
  main.prepend(toolbar);
  document.querySelectorAll('#punjabiGlossary audio').forEach(player => {
    player.addEventListener('play', () => {
      document.querySelectorAll('#punjabiGlossary audio').forEach(other => {
        if (other !== player) other.pause();
      });
    });
  });
})();

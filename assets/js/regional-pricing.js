/* Browser convenience gate. Enforce country restrictions at the hosting edge too. */
(() => {
  const prices = { Basic: 150, Plus: 230, Complete: 300 };
  const restricted = new Set(['IN', 'PK', 'AF', 'BD']);
  const root = document.documentElement;
  let regional = null;
  const ownScript=document.currentScript?.src;
  async function ownerAccess(interactive=false) {
    try {
      if(!interactive&&!sessionStorage.getItem('ms-session-v1'))return false;
      const assetBase=new URL('.',ownScript);
      for(const file of ['backend-config.js','backend.js']) { if(file==='backend-config.js'&&window.MS_BACKEND||file==='backend.js'&&window.MS_API)continue;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(file,assetBase);script.onload=resolve;script.onerror=reject;document.head.append(script);}); }
      if(!window.MS_API.user)return false;
      if(await MS_API.rpc('ms_is_staff',{})!==true)return false;
      root.classList.add('region-allowed');
      if(!document.getElementById('ownerPreviewBanner')){const banner=document.createElement('div');banner.id='ownerPreviewBanner';banner.className='owner-preview-banner';banner.textContent='Owner preview · Public country restrictions remain active. ';const exit=document.createElement('button');exit.textContent='Sign out of preview';exit.onclick=async()=>{await MS_API.logout();location.reload();};banner.append(exit);document.body.prepend(banner);}return true;
    }catch{return false;}
  }
  function ownerForm(gate){const toggle=document.createElement('button');toggle.textContent='Owner / staff sign-in';toggle.type='button';gate.append(toggle);toggle.onclick=()=>{toggle.disabled=true;const form=document.createElement('form'),email=document.createElement('input'),password=document.createElement('input'),submit=document.createElement('button'),message=document.createElement('p');email.type='email';email.autocomplete='username';email.required=true;email.placeholder='Staff email';email.setAttribute('aria-label','Staff email');password.type='password';password.autocomplete='current-password';password.required=true;password.placeholder='Password';password.setAttribute('aria-label','Password');submit.textContent='Sign in to owner preview';message.setAttribute('role','status');form.append(email,password,submit,message);gate.append(form);form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{await ownerAccess(true);await MS_API.login(email.value.trim(),password.value);password.value='';if(!await ownerAccess(true))throw Error('This account does not have staff access.');location.reload();}catch(error){message.textContent=error.message;}finally{submit.disabled=false;}};email.focus();};}

  window.packagePriceText = pack => regional ? format(prices[pack] * regional.rate, regional.currency) : 'Price unavailable until region is verified';
  function format(value, currency) {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.ceil(Number((value / 10).toFixed(10))) * 10);
  }
  function showGate(title, message, retry = false) {
    root.classList.remove('region-allowed');
    const gate = document.getElementById('regionGate');
    gate.replaceChildren();
    const heading = document.createElement('p'); heading.className = 'region-gate-title'; heading.textContent = title;
    const text = document.createElement('p'); text.textContent = message;
    gate.append(heading, text); ownerForm(gate);
    if (retry) { const button = document.createElement('button'); button.textContent = 'Try again'; button.onclick = () => location.reload(); gate.append(button); }
  }
  async function json(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Service unavailable');
    return response.json();
  }
  function render() {
    document.querySelectorAll('[data-package-price]').forEach(el => {
      const pack = el.dataset.packagePrice === 'selected' ? document.querySelector('input[name="package"]:checked')?.value : el.dataset.packagePrice;
      el.textContent = window.packagePriceText(pack);
    });
  }
  async function country() {
    try { const saved=JSON.parse(sessionStorage.getItem('ms-region-v2')); if(saved && Date.now()-saved.time<600000 && /^[A-Z]{2}$/.test(saved.geo.country_code)) return saved.geo; } catch {}
    let geo;
    try { geo=await json('https://ipapi.co/json/'); if(geo.error || !/^[A-Z]{2}$/.test(geo.country_code||'')) throw Error('Invalid country'); }
    catch { const fallback=await json('https://ipwho.is/'); if(fallback.success!==true || !/^[A-Z]{2}$/.test(fallback.country_code||'')) throw Error('Unknown country'); geo={country_code:fallback.country_code,country_name:fallback.country,currency:fallback.currency?.code||''}; }
    try { sessionStorage.setItem('ms-region-v2',JSON.stringify({time:Date.now(),geo})); } catch {}
    return geo;
  }
  async function start() {
    if(location.protocol==='file:') {
      root.classList.add('region-allowed'); regional={currency:'CAD',rate:1}; render();
      const note=document.createElement('div');note.textContent='LOCAL OWNER PREVIEW · Sample CAD prices · Public country restrictions remain active';note.style.cssText='position:relative;z-index:10000;padding:10px;text-align:center;background:#edd5a3;color:#12352d;font-size:12px';document.body.prepend(note);document.addEventListener('change',render);return;
    }
    try {
      if(await ownerAccess())return;
      const geo = await country();
      if (!/^[A-Z]{2}$/.test(geo.country_code || '') || geo.error) throw new Error('Unknown region');
      if (restricted.has(geo.country_code)) { showGate('Service unavailable in your region', 'MERI SUKHNA is for families living outside India, Pakistan, Afghanistan and Bangladesh.'); return; }
      const currency = String(geo.currency || '').toUpperCase();

      root.classList.add('region-allowed');
      // Country access can be verified independently of currency-service availability.
      let rate = 1, rateDate = '';
      try {
        if (!/^[A-Z]{3}$/.test(currency)) throw Error('Currency unavailable');
        if (currency !== 'CAD') {
          const fx = await json('https://api.frankfurter.dev/v2/rate/CAD/' + currency);
          rate = Number(fx.rate); rateDate = fx.date || '';
          if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid rate');
        }
        regional = { currency, rate }; window.msRegional = Object.freeze({country:geo.country_code,currency,rate,rateDate});
      } catch { regional = null; }
      render();
      document.dispatchEvent(new Event('regional-prices-ready'));
      document.querySelectorAll('[data-region-note]').forEach(el => {
        el.textContent = regional ? 'Prices in ' + currency + ' for ' + geo.country_name + '. ' + (currency === 'CAD' ? 'Package prices exclude additions.' : 'Converted package estimates' + (rateDate ? ' using rates dated ' + rateDate : '') + ', rounded up to the next 10; final amount confirmed before proceeding.') + ' Additions are charged extra at shop prices.' : 'Local currency pricing is temporarily unavailable. No alternate currency is shown. Please request a quote on WhatsApp.';
      });
      root.classList.add('region-allowed');
      document.addEventListener('change', render);
    } catch { showGate('We could not verify your region', 'Please retry to check service availability and view local currency pricing.', true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

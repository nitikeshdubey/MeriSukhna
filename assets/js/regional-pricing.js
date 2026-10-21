/* Browser convenience gate. Enforce country restrictions at the hosting edge too. */
(() => {
  const prices = { Basic: 150, Plus: 230, Complete: 300 };
  const restricted = new Set(['IN', 'PK', 'AF', 'BD']);
  const root = document.documentElement;
  let regional = null;
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
    gate.append(heading, text);
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

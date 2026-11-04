'use strict';
const familyPreferences = (() => {
  const builder = document.getElementById('customForm');
  const byId = id => document.getElementById(id);
  const places = [
    ['02', 'Amritsar'], ['03', 'Amritsar'], ['04', 'Amritsar'], ['05', 'Amritsar'],
    ['11', 'Tarn Taran'], ['12', 'Kapurthala'], ['13', 'Rupnagar'], ['06', 'Bathinda'],
    ['07', 'Fatehgarh Sahib'], ['08', 'Ludhiana'], ['09', 'Ludhiana'], ['10', 'Tarn Taran']
  ];
  const knownPlaces = new Map(Array.from(builder.elements.gurdwara.options).slice(1, 13)
    .map((option, index) => [option.value, places[index]]));
  const substitutionRows = [];
  const substitutions = ['Ask me first', 'Skip this item', 'Use this alternative'];
  const marker = 'Family arrangements\n';
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  let timeZone = deviceZone;

  for (const item of builder.querySelectorAll('[name="addition"]')) {
    if (item.value === 'Live video call' || item.value === 'Ardaas') continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'field';
    const label = document.createElement('label');
    const select = document.createElement('select');
    const alternative = document.createElement('input');
    select.id = 'substitution-' + substitutionRows.length;
    label.htmlFor = select.id;
    label.textContent = item.value + ' · if unavailable';
    substitutions.forEach(value => select.add(new Option(value, value)));
    alternative.type = 'text';
    alternative.maxLength = 65;
    alternative.setAttribute('aria-label', 'Approved alternative for ' + item.value);
    alternative.placeholder = 'Describe the approved alternative';
    wrapper.append(label, select, alternative);
    byId('substitutionFields').append(wrapper);
    substitutionRows.push({item, wrapper, select, alternative});
  }

  function sync() {
    const place = builder.elements.gurdwara.value;
    const known = knownPlaces.get(place);
    const name = place === 'Other' ? builder.elements.otherPlace.value.trim() : place;
    const image = byId('selectedPlacePhoto');
    byId('selectedPlace').hidden = !name;
    image.hidden = !known;
    if (known) {
      image.src = 'assets/images/gurdwara-' + known[0] + '-small.webp';
      image.alt = name;
    }
    byId('selectedPlaceTitle').textContent = name;
    byId('selectedPlaceDistrict').textContent = known ? known[1] + ' district, Punjab' : 'The coordinator will verify this location with you.';
    byId('ludhianaDistinction').hidden = known?.[0] !== '08';
    byId('nameApprovalField').hidden = !(byId('englishName').value.trim() || byId('punjabiName').value.trim());
    byId('callDetails').hidden = !byId('requestCallback').checked;
    byId('callbackZone').textContent = timeZone || 'Please specify your time zone in the notes.';
    byId('substitutionFields').hidden = !substitutionRows.some(row => row.item.checked);
    for (const row of substitutionRows) {
      row.wrapper.hidden = !row.item.checked;
      row.alternative.hidden = row.select.value !== substitutions[2];
    }
  }

  function notes() {
    const entries = [];
    const add = (key, value) => { if (value) entries.push(key + ': ' + value); };
    add('Name in English', byId('englishName').value.trim());
    add('Name in Punjabi', byId('punjabiName').value.trim());
    if (byId('nameApproved').checked && !byId('nameApprovalField').hidden) add('Spelling approved', 'Yes');
    for (const row of substitutionRows) {
      if (row.item.checked) add('If unavailable — ' + row.item.value, row.select.value === substitutions[2]
        ? row.select.value + ' — ' + row.alternative.value.trim() : row.select.value);
    }
    add('Recording preference', byId('recordingPreference').value);
    if (byId('requestCallback').checked) {
      add('Callback language', byId('callbackLanguage').value);
      add('Requested callback', byId('callbackDate').value + ' ' + byId('callbackTime').value + ' (' + timeZone + ')');
      add('Callback number', byId('callbackNumber').value.trim());
    }
    const free = builder.elements.notes.value.trim();
    return entries.length ? marker + entries.join('\n') + (free ? '\n\n' + free : '') : free;
  }

  function restore(saved) {
    const raw = String(saved || '');
    const hasPrefs = raw.startsWith(marker);
    const parts = hasPrefs ? raw.slice(marker.length).split('\n\n') : [];
    const fields = new Map((parts.shift() || '').split('\n').map(line => {
      const split = line.indexOf(': ');
      return [line.slice(0, split), line.slice(split + 2)];
    }));
    builder.elements.notes.value = hasPrefs ? parts.join('\n\n') : raw;
    byId('englishName').value = fields.get('Name in English') || '';
    byId('punjabiName').value = fields.get('Name in Punjabi') || '';
    byId('nameApproved').checked = fields.get('Spelling approved') === 'Yes';
    byId('placeApproved').checked = false;
    byId('recordingPreference').value = fields.get('Recording preference') || '';
    for (const row of substitutionRows) {
      const value = fields.get('If unavailable — ' + row.item.value) || substitutions[0];
      const [choice,...detail] = value.split(' — ');
      row.select.value = substitutions.includes(choice) ? choice : substitutions[0];
      row.alternative.value = detail.join(' — ');
    }
    byId('requestCallback').checked = fields.has('Callback language');
    byId('callbackLanguage').value = fields.get('Callback language') || 'English';
    const call = (fields.get('Requested callback') || '').match(/^(\d{4}-\d\d-\d\d) (.*?) \((.*?)\)$/);
    timeZone = call?.[3] || deviceZone;
    byId('callbackDate').value = call?.[1] || '';
    byId('callbackTime').value = call?.[2] || '09:00–12:00';
    byId('callbackNumber').value = fields.get('Callback number') || '';
    sync();
  }

  function invalid(step) {
    if (step === 1 && !byId('placeApproved').checked) return [byId('placeApproved'), 'Please confirm the Gurudwara name and location.'];
    if (step === 2) {
      const missing = substitutionRows.find(r => r.item.checked && r.select.value === substitutions[2] && !r.alternative.value.trim());
      if (missing) return [missing.alternative, 'Describe the alternative you approve.'];
    }
    if (step === 3) {
      if (!byId('nameApprovalField').hidden && !byId('nameApproved').checked) return [byId('nameApproved'), 'Please confirm the spelling of the name.'];
      if (byId('requestCallback').checked) {
        if (!byId('callbackDate').value || !byId('callbackDate').validity.valid) return [byId('callbackDate'), 'Choose today or a future callback date.'];
        if (!/^\+[1-9]\d{6,14}$/.test(byId('callbackNumber').value.replace(/[ ()-]/g, ''))) return [byId('callbackNumber'), 'Enter a phone number with country code.'];
      }
      if (notes().length > 1200) return [builder.elements.notes, 'Shorten the notes or family preferences. The combined limit is 1,200 characters.'];
    }
    return null;
  }
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  byId('callbackDate').min = today.toISOString().slice(0, 10);
  builder.addEventListener('input', event => {
    if (['callbackDate','callbackTime'].includes(event.target.id)) timeZone = deviceZone;
    if (['gurdwara','otherPlace'].includes(event.target.id)) byId('placeApproved').checked = false;
    if (['englishName','punjabiName'].includes(event.target.id)) byId('nameApproved').checked = false;
    event.target.setCustomValidity?.('');
    sync();
  });
  builder.addEventListener('change', sync);
  sync();
  return {notes, restore, invalid};
})();

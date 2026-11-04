const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../assets/js/family-preferences.js'), 'utf8');
const fields = new Map();
function field() {
  return {
    value:'', checked:false, hidden:false, validity:{valid:true}, children:[],
    setAttribute(){}, add(option){if(!this.value)this.value=option.value;},
    append(...children){this.children.push(...children);}
  };
}
function byId(id) { if(!fields.has(id))fields.set(id,field());return fields.get(id); }
const item = Object.assign(field(), {value:'Rumala Sahib',checked:true});
const form = Object.assign(byId('customForm'),{
  elements:{gurdwara:{value:'Test · Amritsar',options:[{value:''},{value:'Test · Amritsar'}]},otherPlace:field(),notes:field()},
  querySelectorAll(){return [item]},addEventListener(){}
});
const context = {document:{getElementById:byId,createElement:field}, Option:function(text,value){this.value=value;}};
vm.runInNewContext(script+'\nthis.preferences=familyPreferences;',context);
const prefs=context.preferences;
assert.equal(prefs.invalid(1)[0],byId('placeApproved'));
byId('placeApproved').checked=true;
assert.equal(prefs.invalid(1),null);
byId('englishName').value='Test Family';
byId('punjabiName').value='ਪੰਜਾਬ';
byId('nameApprovalField').hidden=false;
assert.equal(prefs.invalid(3)[0],byId('nameApproved'));
byId('nameApproved').checked=true;
const [,choice,alternative]=byId('substitutionFields').children[0].children;
choice.value='Use this alternative';
assert.equal(prefs.invalid(2)[0],alternative);
alternative.value='Blue cloth';
form.elements.notes.value='Keep this line\n\nand this paragraph.';
byId('recordingPreference').value='No recording';
const snapshot=prefs.notes();
prefs.restore(snapshot);
assert.equal(prefs.notes(),snapshot);
assert.equal(byId('placeApproved').checked,false);
assert.equal(prefs.invalid(2),null);
byId('requestCallback').checked=true;
assert.equal(prefs.invalid(3)[0],byId('callbackDate'));
byId('callbackDate').value='2035-05-01';
assert.equal(prefs.invalid(3)[0],byId('callbackNumber'));
byId('callbackLanguage').value='Punjabi';
byId('callbackTime').value='12:00–15:00';
byId('callbackNumber').value='+1 250 555 0199';
assert.equal(prefs.invalid(3),null);
const withCallback=prefs.notes();prefs.restore(withCallback);assert.equal(prefs.notes(),withCallback);
form.elements.notes.value='x'.repeat(1200);assert.equal(prefs.invalid(3)[0],form.elements.notes);
prefs.restore('Older notes');assert.equal(byId('englishName').value,'');assert.equal(form.elements.notes.value,'Older notes');
console.log('PASS: place and name confirmation, substitutions, callback contact and date, private draft round-trip, legacy notes and combined length guard.');

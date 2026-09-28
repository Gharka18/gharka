import { createEmailAuth } from './auth.js';
import { dishes, ingredients, cuisines, allergens, meals } from './data.js';
import { defaults, days, eligible, generatePlan, replacement, groceryList, formatAmount, validPreferences, resolveExclusions, planSummary, emptyMealReason } from './planner.js';
import { loadState, saveState, householdStorageKey } from './state.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account = null, authReady = false, authFailed = false;
const emailAuth = createEmailAuth();
const householdKey = () => householdStorageKey(account?.id);
const icons={plan:'▦',groceries:'▤',preferences:'☷'};
let { prefs, plan, checked, needsPreferences, recoveryNotice, storageWarning } = loadState((key) => localStorage.getItem(householdKey()));
let view = needsPreferences ? 'preferences' : 'plan', notice = '';
let selectedDay = 0;
function save() {
  storageWarning = saveState((key, value) => localStorage.setItem(householdKey(), value), { prefs, plan, checked, needsPreferences });
}
function completionMessage() {
  const summary = planSummary(plan);
  return summary.missing
    ? `${summary.planned} of ${summary.total} meals found. ${summary.missing} slots have no match; your restrictions were kept.`
    : 'Your week is ready. The grocery list has been updated.';
}
function toast(message){notice=message;render();setTimeout(()=>{if(notice===message){notice='';const n=$('.toast');if(n)n.remove();}},5000);}
const dishById=id=>dishes.find(d=>d.id===id);
function render(){
 const unknownExclusions=resolveExclusions(prefs).unknown;
 const grocery=groceryList(plan,prefs.people),count=plan.flatMap(d=>Object.values(d.meals)).filter(Boolean).length;
 $('#app').innerHTML=`<aside class="sidebar"><a class="brand" href="#plan" aria-label="GharKa home"><span class="brand-icon">♧</span> GharKa<span class="brand-dot">.</span></a><div class="brand-sub">GOOD FOOD. LESS GUESSWORK.</div><div class="nav-label">YOUR KITCHEN, SORTED</div><nav>${[['plan','Weekly meal plan'],['groceries','Grocery list'],['preferences','My preferences']].map(([key,label])=>`<button aria-label="${label}" aria-current="${view===key?'page':'false'}" class="nav-item ${view===key?'active':''}" data-view="${key}"><span aria-hidden="true">${icons[key]}</span><span class="nav-label-text">${label}</span>${key==='groceries'?`<small>${grocery.length}</small>`:''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="home-icon">⌂</div><strong>A little planning.<br>A lot more peace.</strong><p>Made for everyday Indian kitchens. And everyone in yours.</p><span class="made">Made with a little extra pyaar ♡</span></div></aside>
 <div class="workspace"><header class="topbar"><span>Your home kitchen companion</span><div class="account-controls"><button class="secondary" id="account-button" ${authReady?'':'disabled'}>${account?'My account':'Sign in'}</button><div class="household"><span class="avatar">⌂</span><span>My household <small>${prefs.people} ${prefs.people===1?'member':'members'}</small></span><button class="text-button" id="edit-household" aria-label="Edit household size">✎ Edit</button></div></div></header><main><div class="page-heading"><div><div class="eyebrow">LESS “AAJ KYA BANAYE?”</div><h1>${view==='plan'?'A delicious week, sorted.':view==='groceries'?'One list. A happier kitchen.':'A plan that feels like home.'}</h1><p>${view==='plan'?'Familiar favourites, a little variety, and one less thing to think about.':view==='groceries'?'Everything for your week, brought together in one place.':'Tell us what works for your family. We’ll take care of the ideas.'}</p></div>${view==='plan'?`<button class="primary" id="regenerate" ${needsPreferences?'disabled':''}><span>↻</span> Plan a new week</button>`:''}</div>
 ${storageWarning?`<div class="info-banner" role="alert">${esc(storageWarning)} ${!needsPreferences?'<button class="text-button" id="retry-save">Try saving again</button>':''}</div>`:''}
 ${recoveryNotice?`<div class="info-banner" role="status">${esc(recoveryNotice)} ${needsPreferences?'<button class="text-button" data-view="preferences">Confirm preferences</button>':''}</div>`:''}
 ${unknownExclusions.length?`<div class="info-banner" role="alert">We could not recognise these saved exclusions: ${esc(unknownExclusions.join(', '))}. Meal suggestions are paused until you clarify them in My preferences. <button class="text-button" data-view="preferences">Edit preferences</button></div>`:''}
 ${view==='plan'?planView(count):view==='groceries'?groceryView(grocery):preferencesView()}
 <footer><span>Thoughtfully planned. Happily homemade.</span><span>GharKa · Your everyday food companion</span></footer></main></div>${notice?`<div class="toast" role="status">${esc(notice)}</div>`:''}<dialog id="dish-dialog" aria-labelledby="dish-title"></dialog><dialog id="auth-dialog" aria-labelledby="auth-title"></dialog><dialog id="household-dialog" aria-labelledby="household-title"></dialog>`;
 bind();
}
function planView(count){const summary=planSummary(plan);return `<section class="week-banner"><div><span class="pill">✦ YOUR WEEK, YOUR WAY</span><h2>Good food starts with a little plan.</h2><p>A week of ghar ka khana, made around your family.</p><div class="summary-tags"><span>◉ ${prefs.diet}</span><span>♧ ${prefs.people} people</span><span>◷ Up to ${prefs.time} min / meal</span></div></div><div class="food-art" aria-hidden="true"><span class="spark one">✧</span><div class="plate"><div class="rice">🍚</div><div class="curry">🍛</div><div class="veg">🥬</div><div class="roti">🫓</div></div><span class="spark two">✧</span><span class="art-caption">a little taste of home</span></div></section>
 <div class="section-heading"><div><h2>Your weekly menu <span class="light-tag">7 days</span></h2><p>${count} of ${summary.total} meals planned · ${prefs.cuisines.length?prefs.cuisines.join(', '):'Flavours from across India'}</p></div><button class="text-button" data-view="preferences">☷ Edit preferences</button></div>
 ${summary.missing?`<div class="info-banner" role="status">${needsPreferences?'Confirm your preferences before creating a week.':`${summary.planned} of ${summary.total} meals found. ${summary.missing} slots have no matching dish. Your dietary restrictions and allergies have been kept.`}</div>`:''}
 <div class="menu-help"><span>↻ Swap any dish for a fresh idea. Select a dish to see ingredients and cooking notes.</span><button class="text-button" data-view="groceries">View grocery list →</button></div>
 <div class="day-picker" role="group" aria-label="Choose a day">${days.map((day,index)=>`<button class="day-button" data-select-day="${index}" aria-pressed="${selectedDay===index}">${day.slice(0,3)}</button>`).join('')}</div><div class="week-grid" style="--slots:${prefs.slots.length}"><div class="grid-head day-col">DAY</div>${prefs.slots.map((s,i)=>`<div class="grid-head"><span>${{Breakfast:'☀',Lunch:'◒',Snacks:'☕',Dinner:'☾'}[s]}</span> ${s}</div>`).join('')}${plan.map((day,dayIndex)=>`<div class="day-cell ${selectedDay===dayIndex?'selected-day':''}" data-menu-day="${dayIndex}"><strong>${day.day.slice(0,3)}</strong><span>DAY ${dayIndex+1}</span></div>${prefs.slots.map(slot=>{const d=dishById(day.meals[slot]);return `<article class="meal-cell ${selectedDay===dayIndex?'selected-day':''}" data-menu-day="${dayIndex}" data-label="${day.day} · ${slot}">${d?`<button class="dish-open" data-dish="${d.id}" aria-label="View ${esc(d.name)} for ${day.day} ${slot}"><span class="dish-emoji tone-${dayIndex%4}" aria-hidden="true">${d.emoji}</span><strong>${d.name}</strong></button><div class="dish-bottom"><span>◷ ${d.time} min</span><button class="swap" data-day="${dayIndex}" data-slot="${slot}" aria-label="Replace ${esc(d.name)} for ${day.day} ${slot}" title="Replace dish">↻ Swap</button></div>`:`<div class="empty-meal"><strong>${needsPreferences?'Confirm preferences':'No matching dish'}</strong><p>${esc(needsPreferences?'Review your dietary choices before generating meals.':emptyMealReason(prefs,slot))}</p><button class="text-button" data-view="preferences">Edit preferences</button></div>`}</article>`;}).join('')}`).join('')}</div>
 <div class="bottom-cards"><div class="tip-card"><span class="tip-icon">♧</span><div><strong>Your Sunday self will thank you.</strong><p>Check your pantry, then use your grocery list for one easy shop.</p></div><button class="text-button" data-view="groceries">Let’s make a list →</button></div><div class="small-note">♡ <span>Less food stress.<br>More time around the table.</span></div></div><p class="fineprint">Cooking times assume soaked pulses and prepared batter where needed. Suggestions may repeat when choices are limited.</p>`;}
function pantryFields() {
  const selected = prefs.pantry || [];
  const groups = Object.values(ingredients).reduce((result, item) => {
    (result[item.category] ||= []).push(item);
    return result;
  }, {});
  return `<section class="panel pantry-panel"><div class="step-label">03 · WHAT'S IN YOUR KITCHEN?</div><h2>Which ingredients do you already have?</h2><p class="field-help">Optional. Select what you have at home. We favour these ingredients when dishes are equally varied, while keeping your diet and allergies first. Leave blank if you plan to shop for everything.</p>${Object.entries(groups).map(([category, items]) => `<details class="pantry-group" ${selected.some(id => items.some(item => item.id === id)) ? 'open' : ''}><summary>${category}</summary><div class="choice-row">${items.map(item => `<label class="choice"><input type="checkbox" name="pantry" value="${item.id}" ${selected.includes(item.id) ? 'checked' : ''}><span>${item.name}</span></label>`).join('')}</div></details>`).join('')}<p class="field-help">Selecting an ingredient does not override an allergy or a food you dislike. The grocery list keeps full weekly quantities so you can check that you have enough.</p></section>`;
}
function preferencesView(){return `${needsPreferences ? '<section class="info-banner setup-intro"><strong>Welcome to GharKa. Let’s plan around your household.</strong><p>First, tell us your preferences, allergies and what’s in your kitchen. Your week will appear only after you choose “Create my week”. You can use GharKa as a guest.</p></section>' : ''}<form id="preferences-form"><ol class="setup-steps" aria-label="Planning steps"><li aria-current="step">1 · Household</li><li>2 · Preferences</li><li>3 · Ingredients</li></ol><p id="step-status" class="field-help" aria-live="polite">Step 1 of 3 · Your household</p><div class="preference-layout"><section class="panel"><div class="step-label">01 · YOUR HOUSEHOLD</div><h2>Who’s coming to the table?</h2><fieldset><legend>Food preference</legend><div class="choice-row">${['Vegetarian','Eggetarian','Non-Vegetarian'].map(d=>`<label class="choice"><input type="radio" name="diet" value="${d}" ${prefs.diet===d?'checked':''}><span>${d}</span></label>`).join('')}</div><p class="field-help">Eggetarian includes eggs and vegetarian food. Non-vegetarian includes all three.</p></fieldset><label class="field-label" for="people">Number of family members</label><input class="number-input" id="people" name="people" type="number" min="1" max="12" required value="${prefs.people}"><fieldset><legend>Meals to plan</legend><div class="choice-row">${meals.map(m=>`<label class="choice"><input type="checkbox" name="slots" value="${m}" ${prefs.slots.includes(m)?'checked':''}><span>${m}</span></label>`).join('')}</div></fieldset><label class="field-label" for="time">Cooking time available per meal</label><select id="time" name="time">${[15,30,45,60].map(t=>`<option value="${t}" ${prefs.time===t?'selected':''}>Up to ${t} minutes</option>`).join('')}</select></section>
 <section class="panel"><div class="step-label">02 · YOUR KIND OF FOOD</div><h2>Keep the favourites. Skip the rest.</h2><fieldset><legend>Preferred Indian cuisines</legend><p class="field-help">Leave all unchecked for every cuisine. Everyday Indian dishes are always included.</p><div class="choice-row">${cuisines.map(c=>`<label class="choice"><input type="checkbox" name="cuisines" value="${c}" ${prefs.cuisines.includes(c)?'checked':''}><span>${c}</span></label>`).join('')}</div></fieldset><label class="field-label" for="dislikes">Foods you dislike</label><input id="dislikes" name="dislikes" placeholder="e.g. bhindi, onion, paneer" value="${esc(prefs.dislikes)}"><p class="field-help">Separate foods with commas. Common names like aloo, palak and dahi work too.</p><fieldset><legend>Allergies to avoid</legend><div class="choice-row compact">${allergens.map(a=>`<label class="choice"><input type="checkbox" name="allergies" value="${a}" ${prefs.allergies.includes(a)?'checked':''}><span>${a}</span></label>`).join('')}</div></fieldset><label class="field-label" for="otherAllergies">Other ingredients to avoid</label><input id="otherAllergies" name="otherAllergies" placeholder="e.g. coconut, mustard" value="${esc(prefs.otherAllergies)}"><p class="field-help">Use ingredient names or allergen checkboxes. Unrecognised exclusions must be clarified before a new plan can be created.</p></section>${pantryFields()}</div><div class="info-banner">Allergy filters use listed ingredients. Always check packaged-food labels, substitutions and cross-contact when cooking.</div><div class="form-actions"><span id="form-error" role="alert">Saving will create a fresh week and reset your shopping checklist.</span><div class="wizard-actions"><button class="secondary" type="button" id="setup-back" hidden>← Back</button><button class="primary" type="button" id="setup-next">Continue →</button><button class="primary" type="submit" hidden>${needsPreferences ? 'Create my week' : 'Save & create my week'} →</button></div></div></form>`;}
function groceryView(list){const groups=Object.groupBy?Object.groupBy(list,i=>i.category):list.reduce((a,i)=>((a[i.category]??=[]).push(i),a),{});const done=list.filter(i=>checked.includes(i.id)).length;return `<section class="grocery-summary"><div><span class="step-label">YOUR WEEKLY SHOP</span><h2>${list.length} ingredients, all in one place.</h2><p>For ${prefs.people} people · ${done} of ${list.length} checked off</p><progress aria-label="Shopping progress" value="${done}" max="${list.length||1}"></progress></div><div class="grocery-actions"><button class="secondary" id="download" ${!list.length?'disabled':''}>↓ Download list</button><button class="text-button" id="clear-checks">Clear checkmarks</button></div></section><div class="info-banner">Quantities are approximate for adult servings. Items marked ‘Already at home’ still show the full weekly quantity. Check your stock, then buy what is missing. Round up to the pack sizes you buy.</div>${!list.length?'<section class="panel"><h2>No groceries yet</h2><p>Update your preferences to find meals for your week.</p><button class="primary" data-view="preferences">Edit preferences</button></section>':`<div class="grocery-grid">${Object.entries(groups).map(([category,items])=>`<section class="grocery-group"><h3>${category}<span>${items.length}</span></h3>${[...items].sort((a,b)=>Number(prefs.pantry?.includes(a.id)||false)-Number(prefs.pantry?.includes(b.id)||false)).map((i,index,sorted)=>`${index===0||Boolean(prefs.pantry?.includes(i.id))!==Boolean(prefs.pantry?.includes(sorted[index-1].id))?`<h4 class="grocery-stock-heading">${prefs.pantry?.includes(i.id)?'Already at home · check stock':'To check / buy'}</h4>`:''}<label class="grocery-item ${checked.includes(i.id)?'checked':''}"><input type="checkbox" data-grocery="${i.id}" ${checked.includes(i.id)?'checked':''}><span>${i.name}${prefs.pantry?.includes(i.id)?'<small class="pantry-note">Already at home — check quantity</small>':''}</span><strong>${formatAmount(i.amount,i.unit)}</strong></label>`).join('')}</section>`).join('')}</div>`}`;}
function bind(){
 $('#edit-household')?.addEventListener('click',openHousehold);
 document.querySelectorAll('[data-select-day]').forEach(button => button.onclick = () => {
   selectedDay = Number(button.dataset.selectDay);
   document.querySelectorAll('[data-menu-day]').forEach(node => node.classList.toggle('selected-day', Number(node.dataset.menuDay) === selectedDay));
   document.querySelectorAll('[data-select-day]').forEach(node => node.setAttribute('aria-pressed', String(Number(node.dataset.selectDay) === selectedDay)));
 });
 setupWizard();
 $('#account-button')?.addEventListener('click',openAccount);
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const nextView=needsPreferences?'preferences':b.dataset.view;if(view!==nextView){view=nextView;render();}window.scrollTo(0,0);}));
 $('.brand').onclick=e=>{e.preventDefault();view=needsPreferences?'preferences':'plan';render();window.scrollTo(0,0);};
 $('#regenerate')?.addEventListener('click',()=>{view='preferences';render();window.scrollTo(0,0);});
 $('#retry-save')?.addEventListener('click',()=>{save();render();});
 document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const index=+b.dataset.day,slot=b.dataset.slot,id=replacement(plan,prefs,index,slot);if(!id){toast('No other dish matches this meal and your preferences. Your current meal and grocery list were kept.');document.querySelector(`[data-day="${index}"][data-slot="${slot}"]`)?.focus();return;}plan[index].meals[slot]=id;checked=[];save();toast(`Swapped to ${dishById(id).name}. Grocery quantities updated; checkmarks reset.`);const button=document.querySelector(`[data-day="${index}"][data-slot="${slot}"]`);button?.focus();});
 document.querySelectorAll('[data-dish]').forEach(b=>b.onclick=()=>openDish(b.dataset.dish));
 $('#preferences-form')?.addEventListener('submit',e=>{e.preventDefault();if(!e.target.checkValidity()){e.target.reportValidity();return;}const form=new FormData(e.target);if(!form.getAll('slots').length){$('#form-error').textContent='Please select at least one meal to plan.';return;}const next={diet:form.get('diet'),people:Number(form.get('people')),slots:form.getAll('slots'),cuisines:form.getAll('cuisines'),dislikes:form.get('dislikes').trim(),allergies:form.getAll('allergies'),otherAllergies:form.get('otherAllergies').trim(),time:Number(form.get('time')),pantry:form.getAll('pantry')};if(!validPreferences(next)){$('#form-error').textContent='Check your choices: choose 1–12 family members and at least one meal.';return;}const unknown=resolveExclusions(next).unknown;if(unknown.length){$('#form-error').textContent=`We could not recognise: ${unknown.join(', ')}. Please check the spelling, separate foods with commas, or use the allergy checkboxes. Your changes have not been saved.`;return;}prefs=next;needsPreferences=false;recoveryNotice='';plan=generatePlan(prefs);checked=[];view='plan';save();window.scrollTo(0,0);toast(completionMessage());});
 document.querySelectorAll('[data-grocery]').forEach(b=>b.onchange=()=>{checked=b.checked?[...new Set([...checked,b.dataset.grocery])]:checked.filter(id=>id!==b.dataset.grocery);save();render();document.querySelector(`[data-grocery="${b.dataset.grocery}"]`)?.focus();});
 $('#clear-checks')?.addEventListener('click',()=>{checked=[];save();render();});
 $('#download')?.addEventListener('click',()=>{
  let url;
  try {
    const list=groceryList(plan,prefs.people);
    if(!list.length){toast('There are no ingredients to download. Create a matching meal plan first.');return;}
    let category='';
    const lines=[`GharKa grocery list — ${prefs.people} people, 7 days`,'Approximate quantities. Check your pantry and product labels.',''];
    list.forEach(i=>{if(category!==i.category){category=i.category;lines.push('',category.toUpperCase());}lines.push(`${checked.includes(i.id)?'[x]':'[ ]'} ${i.name} — ${formatAmount(i.amount,i.unit)}${prefs.pantry?.includes(i.id)?' (Already at home — check quantity)':''}`);});
    url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='gharka-grocery-list.txt';
    document.body.append(link);link.click();link.remove();
  } catch {toast('The grocery download could not be started. Your list is still here; please try again.');}
  finally {if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
 });
}

function setupWizard() {
  const form = $('#preferences-form');
  if (!form) return;
  let step = 0;
  const panels = [...form.querySelectorAll('.panel')];
  const labels = ['Your household', 'Your preferences', 'Ingredients at home'];
  const show = (focus = true) => {
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    form.querySelectorAll('.setup-steps li').forEach((item, index) => {
      if (index === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    $('#step-status').textContent = `Step ${step + 1} of 3 · ${labels[step]}`;
    $('#setup-back').hidden = step === 0;
    $('#setup-next').hidden = step === 2;
    form.querySelector('[type="submit"]').hidden = step !== 2;
    if (focus) {
      const heading = panels[step].querySelector('h2');
      heading.tabIndex = -1;
      heading.focus();
    }
  };
  $('#setup-next').onclick = () => {
    if (step === 0) {
      if (!$('#people').reportValidity()) return;
      if (!form.querySelector('[name="slots"]:checked')) {
        $('#form-error').textContent = 'Please select at least one meal to plan.';
        return;
      }
    }
    if (step === 1) {
      const unknown = resolveExclusions({dislikes: $('#dislikes').value, otherAllergies: $('#otherAllergies').value, allergies: []}).unknown;
      if (unknown.length) {
        $('#form-error').textContent = `We could not recognise: ${unknown.join(', ')}. Check the spelling or use the allergy checkboxes.`;
        return;
      }
    }
    $('#form-error').textContent = 'Saving will create a fresh week and reset your shopping checklist.';
    step++; show();
  };
  $('#setup-back').onclick = () => { step--; show(); };
  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input') && step < 2) {
      event.preventDefault(); $('#setup-next').click();
    }
  });
  show(false);
}

function openHousehold() {
  const dialog = $('#household-dialog');
  const draft = $('#people');
  dialog.innerHTML = `<h2 id="household-title">My household</h2><p>How many people are we cooking for?</p><form id="household-form"><label class="field-label" for="household-people">Family members (1–12)</label><div class="people-stepper"><button type="button" class="secondary" id="people-less" aria-label="One fewer member">−</button><input id="household-people" type="number" min="1" max="12" required value="${esc(draft?.value || prefs.people)}"><button type="button" class="secondary" id="people-more" aria-label="One more member">+</button></div><p class="field-help">${draft ? 'This updates your setup. Your saved plan stays unchanged until you create your week.' : 'Your meals will stay the same. Grocery quantities will update, and shopping checkmarks will reset if the size changes.'}</p><div class="wizard-actions"><button type="button" class="secondary" id="cancel-household">Cancel</button><button class="primary" type="submit">Save household</button></div></form>`;
  const input = $('#household-people');
  const updateButtons = () => {
    $('#people-less').disabled = Number(input.value) <= 1;
    $('#people-more').disabled = Number(input.value) >= 12;
  };
  for (const [id, change] of [['people-less', -1], ['people-more', 1]]) {
    $(`#${id}`).onclick = () => { input.value = Math.max(1, Math.min(12, (Number(input.value) || 1) + change)); updateButtons(); };
  }
  input.oninput = updateButtons;
  $('#cancel-household').onclick = () => dialog.close();
  $('#household-form').onsubmit = event => {
    event.preventDefault();
    if (!input.reportValidity()) return;
    const people = Number(input.value);
    if (draft) { draft.value = people; dialog.close(); return; }
    if (people === prefs.people) { dialog.close(); return; }
    prefs = {...prefs, people};
    checked = [];
    save();
    toast('Household updated. Your meals are unchanged; grocery quantities updated and checkmarks reset.');
    $('#edit-household').focus();
  };
  updateButtons();
  dialog.showModal();
}

function openDish(id){const d=dishById(id),dialog=$('#dish-dialog');dialog.innerHTML=`<div class="dialog-head"><span class="dish-emoji">${d.emoji}</span><button class="close-dialog" aria-label="Close dish details">×</button></div><div class="eyebrow">${d.cuisine} · ${d.time} MINUTES</div><h2 id="dish-title">${d.name}</h2><p>${d.diet} · Ingredients for ${prefs.people} people</p><div class="ingredient-list">${Object.entries(d.ingredients).map(([key,qty])=>`<div><span>${ingredients[key].name}</span><strong>${formatAmount(qty*prefs.people,ingredients[key].unit)}</strong></div>`).join('')}</div><h3>In your kitchen</h3><p class="method">${d.method}</p><p class="field-help">${d.allergens.length?`Contains: ${d.allergens.join(', ')}.`:'No tracked allergens in listed ingredients.'} Check product labels and preparation for other allergens.</p><button class="primary close-done">Got it</button>`;dialog.showModal();dialog.querySelector('.close-dialog').onclick=()=>dialog.close();dialog.querySelector('.close-done').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};}
function switchAccount(user) {
  const changed = (account?.id || null) !== (user?.id || null);
  account = user;
  authReady = true;
  authFailed = false;
  if (changed) {
    ({ prefs, plan, checked, needsPreferences, recoveryNotice, storageWarning } = loadState(() => localStorage.getItem(householdKey())));
    view = needsPreferences ? 'preferences' : 'plan';
    notice = '';
  }
  // Token refresh must not discard a partially filled preference form.
  if (changed || !$('#account-button') || $('#account-button').disabled) render();
}

function openAccount() {
  const dialog = $('#auth-dialog');
  dialog.innerHTML = `<h2 id="auth-title">${account ? 'Your GharKa account' : 'Sign in to GharKa'}</h2>${account
    ? `<p>Signed in as ${esc(account.email || '')}</p><p>Your plan is saved separately on this browser. Cross-device syncing is not available yet.</p><button class="secondary" id="sign-out">Sign out</button>`
    : `<p>Get a sign-in link by email. No password to remember.</p><p>Guest and account plans are separate on this browser. Signing in does not copy your guest plan or sync it to another device.</p>${emailAuth.configured && !authFailed
      ? '<form id="sign-in-form"><label class="field-label" for="sign-in-email">Email address</label><input id="sign-in-email" type="email" autocomplete="email" required><button class="primary" type="submit">Email me a sign-in link</button></form>'
      : '<p>Email sign-in is not available right now. You can still plan meals as a guest.</p>'}`}
    <p id="auth-message" role="status" aria-live="polite"></p><button class="text-button" id="close-account">${account ? 'Done' : 'Continue as guest'}</button>`;
  dialog.showModal();
  $('#close-account').onclick = () => dialog.close();
  $('#sign-in-form')?.addEventListener('submit',async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button');
    const message = dialog.querySelector('#auth-message');
    button.disabled = true;
    message.textContent = 'Sending your sign-in link…';
    try {
      await emailAuth.sendLink(form.querySelector('input').value, location.href);
      message.textContent = 'Check your inbox for a sign-in link. You can close this window and continue as a guest while you wait.';
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; }
  });
  $('#sign-out')?.addEventListener('click',async event => {
    event.currentTarget.disabled = true;
    try { await emailAuth.signOut(); switchAccount(null); }
    catch (error) { $('#auth-message').textContent = error.message; $('#sign-out').disabled = false; }
  });
}

if(!needsPreferences)save();
render();
emailAuth.start(switchAccount).catch(() => {
  authReady = true;
  authFailed = true;
  const button = $('#account-button');
  if (button) button.disabled = false;
});

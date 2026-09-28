import { createEmailAuth, authConfigured } from '../src/auth.js';
import { defaults, generatePlan, groceryList, formatAmount } from '../src/planner.js';
import { catalogueVersion, dishes } from '../src/data.js';
import { storageKey } from '../src/state.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fixture = (prefs = defaults) => ({ version: 1, catalogueVersion, prefs: structuredClone(prefs), plan: generatePlan(prefs, () => 0), checked: [] });
let frame, source, memory;
const documentInFrame = () => frame.contentDocument;
const find = selector => documentInFrame().querySelector(selector);
const click = selector => {
  if (selector === 'button[type="submit"]' && find('#preferences-form')) {
    while (!find('#setup-next').hidden) {
      const before = find('#step-status').textContent;
      find('#setup-next').click();
      if (find('#step-status').textContent === before) return;
    }
  }
  const node = find(selector); assert(node, `Missing control: ${selector}`); node.click(); };
const stored = () => JSON.parse(memory.value);
const settle = () => new Promise(resolve => setTimeout(resolve, 50));

async function load(raw = JSON.stringify(fixture()), width = 390, faults = {}) {
  frame?.remove();
  memory = {
    value: raw, failRead: Boolean(faults.read), failWrite: Boolean(faults.write), writes: 0,
    getItem(key) { assert(key === storageKey, 'Unexpected storage key'); if (this.failRead) throw new Error('Blocked test storage'); return this.value; },
    setItem(key, value) { assert(key === storageKey, 'Unexpected storage key'); if (this.failWrite) throw new Error('Test quota exceeded'); this.value = value; this.writes++; }
  };
  window.testStorage = memory;
  frame = document.createElement('iframe');
  frame.title = `Meal planner test preview at ${width} pixels`;
  frame.style.width = `${width}px`;
  frame.height = '800';
  const base = new URL('../', location.href).href;
  const bootstrap = `<script>Object.defineProperty(window,'localStorage',{value:parent.testStorage});<\/script>`;
  const html = source.replace('<head>', `<head><base href="${base}">`).replace('<script src="src/boot.js">', `${bootstrap}<script src="src/boot.js">`);
  const loaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Frame did not load within 10 seconds')), 10000);
    frame.onload = () => { clearTimeout(timer); resolve(); };
  });
  frame.srcdoc = html;
  document.querySelector('#preview').append(frame);
  await loaded;
  await settle();
  assert(find('[data-view="plan"]'), 'Application failed to start');
  assert(!find('#unexpected-error'), 'Unexpected application error');
}

function noOverflow(label) {
  const doc = documentInFrame();
  assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `${label}: page overflows horizontally`);
  const bound = doc.documentElement.clientWidth;
  for (const node of doc.querySelectorAll('button,input,select,dialog[open]')) {
    if (!node.getClientRects().length) continue;
    const rect = node.getBoundingClientRect();
    assert(rect.left >= -1 && rect.right <= bound + 1, `${label}: clipped control ${node.textContent.slice(0, 35)}`);
  }
}

async function run() {
  const button = document.querySelector('#run'); button.disabled = true;
  const results = document.querySelector('#results'); results.replaceChildren();
  let passed = 0, total = 0;
  async function test(name, work) {
    total++;
    const li = document.createElement('li');
    try { await work(); passed++; li.textContent = `PASS — ${name}`; }
    catch (error) { li.className = 'fail'; li.textContent = `FAIL — ${name}: ${error.message}`; }
    results.append(li);
    document.querySelector('#summary').textContent = `${passed} / ${total} browser checks passed`;
  }
  try {
    source = await (await fetch('../index.html', { cache: 'no-store' })).text();
    await test('Initial plan and corrected sandwich quantities render', async () => {
      const saved = fixture(); saved.plan[0].meals.Snacks = 'sandwich';
      await load(JSON.stringify(saved));
      assert(documentInFrame().querySelectorAll('[data-dish]').length === 28, 'Expected 28 dishes');
      click('[data-dish="sandwich"]');
      const text = find('#dish-dialog').textContent;
      assert(text.includes('8 slices') && text.includes('120 g'), 'Wrong scaled recipe quantities');
      assert(!text.includes('Turmeric') && !text.includes('Cooking oil'), 'Phantom sandwich ingredients');
    });
    await test('Swap updates one slot, groceries and saved state; reload retains it', async () => {
      await load();
      click('[data-view="groceries"]'); click('[data-grocery]');
      assert(stored().checked.length === 1, 'Checklist did not save');
      click('[data-view="plan"]');
      const before = stored(); click('[data-day="0"][data-slot="Breakfast"]');
      const after = stored(); let changed = 0;
      before.plan.forEach((day, index) => Object.keys(day.meals).forEach(slot => { if (day.meals[slot] !== after.plan[index].meals[slot]) changed++; }));
      assert(changed === 1, 'Swap changed other meal slots or failed to replace');
      assert(after.checked.length === 0, 'Old shopping checkmarks retained after swap');
      click('[data-view="groceries"]');
      for (const item of groceryList(after.plan, after.prefs.people)) {
        const row = find(`[data-grocery="${item.id}"]`)?.closest('label');
        assert(row?.textContent.includes(formatAmount(item.amount, item.unit)), `Incorrect grocery display: ${item.id}`);
      }
      await load(JSON.stringify(after));
      assert(JSON.stringify(stored().plan) === JSON.stringify(after.plan), 'Swap lost on reload');
    });
    await test('No alternative preserves meal and shopping progress with feedback', async () => {
      const saved = fixture({ ...defaults, slots: ['Breakfast'], cuisines: ['North Indian'], time: 15 });
      saved.checked = ['banana']; await load(JSON.stringify(saved));
      const before = memory.value; click('[data-day="0"][data-slot="Breakfast"]');
      assert(memory.value === before, 'No-alternative action changed saved state');
      assert(find('.toast').textContent.includes('current meal and grocery list were kept'), 'Missing no-alternative feedback');
    });
    await test('Incomplete generation reports accurate counts and time explanation', async () => {
      await load(); click('[data-view="preferences"]');
      find('#time').value = '15'; click('button[type="submit"]');
      assert(find('.toast').textContent.includes('14 of 28'), 'Incorrect completion message');
      assert(documentInFrame().querySelectorAll('.empty-meal').length === 14, 'Expected 14 empty meal slots');
      assert(find('.empty-meal').textContent.includes('15-minute'), 'Missing reason for empty meal');
    });
    await test('No matches produces empty groceries and disables download', async () => {
      await load(JSON.stringify(fixture({ ...defaults, slots: ['Lunch'], time: 15 })));
      click('[data-view="groceries"]');
      assert(find('main').textContent.includes('No groceries yet'), 'Missing empty grocery state');
      assert(find('#download').disabled, 'Empty grocery download still enabled');
    });
    await test('Unknown restrictions and an empty slot selection give form errors', async () => {
      await load(); click('[data-view="preferences"]');
      const before = memory.value; find('#otherAllergies').value = 'unknown-food'; click('button[type="submit"]');
      assert(find('#form-error').textContent.includes('could not recognise'), 'Unknown restriction not explained');
      assert(memory.value === before, 'Invalid preferences saved');
      find('#otherAllergies').value = '';
      documentInFrame().querySelectorAll('[name="slots"]').forEach(node => { node.checked = false; });
      click('button[type="submit"]');
      assert(find('#form-error').textContent.includes('at least one meal'), 'Missing slot validation');
    });
    await test('Unreadable saved data requires preference confirmation without overwriting it', async () => {
      await load('{broken');
      assert(!find('#regenerate') && find('#preferences-form'), 'Unsafe default generation allowed');
      assert(memory.value === '{broken', 'Broken data overwritten before confirmation');
      assert(find('main').textContent.includes('Confirm your dietary preferences'), 'Missing recovery explanation');
      click('[data-view="preferences"]'); click('button[type="submit"]');
      assert(!find('#regenerate').disabled && stored().plan.length === 7, 'Confirmation did not recover planning');
    });
    await test('Invalid saved menu keeps restrictions and clears stale shopping ticks', async () => {
      const saved = fixture({ ...defaults, allergies: ['Dairy'] }); saved.plan = [null]; saved.checked = ['milk'];
      await load(JSON.stringify(saved));
      assert(stored().prefs.allergies.includes('Dairy') && stored().checked.length === 0, 'Recovery lost restrictions or kept stale ticks');
      assert(find('main').textContent.includes('saved menu no longer matches'), 'Missing menu-recovery explanation');
    });
    await test('Blocked storage and quota failures remain usable and allow retry', async () => {
      await load(null, 390, { read: true, write: true });
      assert(find('main').textContent.includes('storage could not be accessed'), 'Read failure hidden');
      click('[data-view="preferences"]'); click('button[type="submit"]');
      assert(find('main').textContent.includes('could not be saved'), 'Write failure hidden');
      memory.failWrite = false; memory.failRead = false; click('#retry-save');
      assert(stored().plan.length === 7, 'Save retry failed');
      assert(!find('#retry-save'), 'Save warning not cleared');
    });
    await test('Download content matches displayed groceries and reports a download error', async () => {
      await load(); click('[data-view="groceries"]');
      const win = frame.contentWindow; let captured, name;
      win.URL.createObjectURL = blob => { captured = blob; return 'blob:gharka-test'; };
      win.URL.revokeObjectURL = () => {};
      win.HTMLAnchorElement.prototype.click = function () { name = this.download; };
      click('#download');
      const text = await captured.text();
      assert(name === 'gharka-grocery-list.txt', 'Wrong download filename');
      for (const item of groceryList(stored().plan, 4)) assert(text.includes(`${item.name} — ${formatAmount(item.amount, item.unit)}`), `Missing downloaded ingredient: ${item.id}`);
      win.URL.createObjectURL = () => { throw new Error('Test download failure'); };
      click('#download');
      assert(find('.toast').textContent.includes('download could not be started'), 'Download failure hidden');
      assert(documentInFrame().querySelectorAll('[data-grocery]').length > 0, 'Grocery list lost after failure');
    });
    await test('Unexpected action failures display a recoverable error without removing the app', async () => {
      await load(); frame.contentWindow.dispatchEvent(new frame.contentWindow.ErrorEvent('error', { message: 'Test failure' }));
      assert(find('#unexpected-error') && find('[data-view="plan"]'), 'No recoverable runtime error message');
    });
    await test('Chickpea exclusion survives form save, swaps, groceries and reload', async () => {
      await load(); click('[data-view="preferences"]');
      find('#otherAllergies').value = 'chickpeas'; click('button[type="submit"]');
      const forbidden = ['chole', 'matki', 'chana-chaat', 'sundal', 'besan-chilla', 'thepla', 'pitla', 'dhokla'];
      const check = () => {
        assert(stored().prefs.otherAllergies === 'chickpeas', 'Restriction was not saved');
        assert(documentInFrame().querySelectorAll('[data-dish]').length === 28, 'Valid meals unnecessarily removed');
        for (const id of forbidden) assert(!find(`[data-dish="${id}"]`), `Excluded dish shown: ${id}`);
      };
      check();
      for (let i = 0; i < 8; i++) { click('[data-day="0"][data-slot="Breakfast"]'); check(); }
      click('[data-view="groceries"]');
      assert(!find('[data-grocery="chana"]') && !find('[data-grocery="besan"]'), 'Excluded ingredients in groceries');
      assert(find('[data-grocery]'), 'Grocery list unexpectedly empty');
      await load(memory.value); check();
    });
    await test('Variety swap removes same-day chickpea overlap and survives reload', async () => {
      const prefs = { ...defaults, slots: ['Lunch', 'Snacks'],
        dislikes: dishes.filter(d => !['matki', 'sundal', 'makhana', 'fruit'].includes(d.id)).map(d => d.name).join(';') };
      const saved = fixture(prefs);
      saved.plan[0].meals.Snacks = 'sundal';
      await load(JSON.stringify(saved));
      const before = stored();
      click('[data-day="0"][data-slot="Snacks"]');
      const after = stored();
      assert(['makhana', 'fruit'].includes(after.plan[0].meals.Snacks), 'Swap kept avoidable chickpea overlap');
      before.plan.forEach((day, index) => Object.keys(day.meals).forEach(slot => {
        if (index !== 0 || slot !== 'Snacks') assert(day.meals[slot] === after.plan[index].meals[slot], 'Swap changed another slot');
      }));
      await load(JSON.stringify(after));
      assert(JSON.stringify(stored().plan) === JSON.stringify(after.plan), 'Variety swap lost on reload');
    });
    await test('First visit asks preferences and ingredients before any plan or storage write', async () => {
      await load(null);
      assert(find('#preferences-form') && find('[name="pantry"]'), 'Missing guided setup');
      assert(!find('[data-dish]') && memory.writes === 0, 'Default plan created before confirmation');
      click('[data-view="plan"]');
      assert(find('#preferences-form') && !find('[data-dish]'), 'Weekly plan bypasses setup');
      find('[name="pantry"][value="paneer"]').checked = true;
      click('[data-view="plan"]');
      assert(find('[name="pantry"][value="paneer"]').checked, 'Setup navigation lost the ingredient draft');
      find('#people').value = '2';
      click('button[type="submit"]');
      assert(stored().prefs.people === 2 && stored().prefs.pantry.includes('paneer'), 'Setup choices were not saved');
      assert(documentInFrame().querySelectorAll('[data-dish]').length === 28, 'Plan missing after confirmation');
      const saved = memory.value;
      await load(saved);
      assert(JSON.stringify(stored().plan) === JSON.stringify(JSON.parse(saved).plan), 'Saved plan lost on return');
    });
    await test('Plan a new week reviews preferences without replacing the saved week early', async () => {
      await load();
      const before = memory.value;
      click('#regenerate');
      assert(find('#preferences-form'), 'New week did not ask questions');
      assert(memory.value === before, 'Plan changed before confirmation');
      click('[data-view="plan"]');
      assert(memory.value === before && find('[data-dish]'), 'Saved week was not retained');
    });
    await test('Pantry stock is marked on groceries and download without reducing weekly quantities', async () => {
      const saved = fixture({...defaults,pantry:['chana']});
      saved.plan[0].meals.Lunch = 'matki';
      await load(JSON.stringify(saved));click('[data-view="groceries"]');
      const row=find('[data-grocery="chana"]').closest('label');
      assert(row.textContent.includes('Already at home'), 'Pantry item is not marked');
      assert([...documentInFrame().querySelectorAll('.grocery-stock-heading')].some(node=>node.textContent==='Already at home · check stock'), 'Missing pantry section');
      assert(row.textContent.includes(formatAmount(groceryList(stored().plan,4).find(i=>i.id==='chana').amount,'g')), 'Pantry quantity was subtracted');
      let blob;frame.contentWindow.URL.createObjectURL = value => {blob=value;return 'blob:test';};
      frame.contentWindow.URL.revokeObjectURL=()=>{};frame.contentWindow.HTMLAnchorElement.prototype.click=()=>{};
      click('#download');assert((await blob.text()).includes('(Already at home — check quantity)'), 'Download lost pantry note');
    });
    await test('Sign-in is visible and guest access preserves the current household', async () => {
      await load();const before=memory.value;
      click('#account-button');
      assert(find('#auth-dialog').open, 'Missing sign-in dialog');
      click('#close-account');
      assert(!find('#auth-dialog').open && memory.value === before, 'Guest option changed the household');
    });
    await test('Missing or unsafe auth settings never load a provider or pretend to sign in', async () => {
      assert(!authConfigured({url:'https://example.com',publishableKey:'sb_publishable_test'}));
      assert(!authConfigured({url:'https://test.supabase.co',publishableKey:'sb_secret_test'}));
      let loaded=false, user='unset';
      const auth=createEmailAuth({url:'',publishableKey:''},()=>{loaded=true;});
      await auth.start(value=>{user=value;});
      assert(!loaded && user===null && !auth.configured, 'Unconfigured auth made a provider request');
      let rejected=false;try{await auth.sendLink('test@example.com','https://example.com/gharka/');}catch{rejected=true;}
      assert(rejected,'Unconfigured auth claimed to send an email');
    });
    await test('Email auth uses provider sessions, correct subpath redirects and logout', async () => {
      let request, callback, stopped=false, signedOut=false;
      const user={id:'test-user',email:'test@example.com'};
      const fake={auth:{
        getSession:async()=>({data:{session:{user}},error:null}),
        onAuthStateChange:cb=>{callback=cb;return {data:{subscription:{unsubscribe(){stopped=true;}}}};},
        signInWithOtp:async value=>{request=value;return {error:null};},
        signOut:async()=>{signedOut=true;callback('SIGNED_OUT',null);return {error:null};}
      }};
      let current;
      const auth=createEmailAuth({url:'https://test.supabase.co',publishableKey:'sb_publishable_test'},async()=>({createClient:()=>fake}));
      await auth.start(value=>{current=value;});assert(current.id===user.id,'Session not restored');
      await auth.sendLink(' test@example.com ','https://gharka18.github.io/gharka/?ignored=1#plan');
      assert(request.email==='test@example.com'&&request.options.emailRedirectTo==='https://gharka18.github.io/gharka/','Wrong email or redirect');
      await auth.signOut();assert(signedOut&&current===null,'Logout did not clear session');
      auth.stop();assert(stopped,'Subscription not released');
    });
    await test('Provider errors do not claim successful email delivery or logout', async () => {
      const auth=createEmailAuth({url:'https://test.supabase.co',publishableKey:'sb_publishable_test'},async()=>({createClient:()=>({auth:{
        getSession:async()=>({data:{session:null},error:null}),
        onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
        signInWithOtp:async()=>({error:new Error('rate limit')}),
        signOut:async()=>({error:new Error('network')})
      }})}));
      await auth.start(()=>{});
      for(const run of [()=>auth.sendLink('bad-email','https://example.com/'),()=>auth.sendLink('test@example.com','https://example.com/'),()=>auth.signOut()]){
        let rejected=false;try{await run();}catch{rejected=true;}assert(rejected,'Failure silently succeeded');
      }
    });
    await test('Household edit scales quantities, preserves meals and restrictions, and survives reload', async () => {
      await load(); click('[data-view="groceries"]'); click('[data-grocery]');
      const before = stored(); click('#edit-household');
      find('#household-people').value = '8'; click('#household-form [type="submit"]');
      const after = stored();
      assert(after.prefs.people === 8 && after.checked.length === 0, 'Size or checklist not updated');
      assert(JSON.stringify(after.plan) === JSON.stringify(before.plan), 'Household edit replaced meals');
      assert(JSON.stringify({...after.prefs, people:4}) === JSON.stringify(before.prefs), 'Other preferences changed');
      for (const item of groceryList(before.plan, 4)) {
        const next = groceryList(after.plan, 8).find(row=>row.id===item.id);
        assert(Math.abs(next.amount - item.amount * 2) < .002, 'Quantity did not scale');
      }
      await load(memory.value); assert(stored().prefs.people === 8, 'Household size lost on reload');
    });
    await test('Household cancel, unchanged save and invalid sizes preserve saved state', async () => {
      await load(); click('[data-view="groceries"]'); click('[data-grocery]');
      const before = memory.value;
      click('#edit-household'); find('#household-people').value='0'; click('#household-form [type="submit"]');
      assert(find('#household-dialog').open && memory.value===before, 'Invalid household saved');
      find('#household-people').value='13'; click('#household-form [type="submit"]');
      assert(memory.value===before, 'Oversized household saved');
      click('#cancel-household'); click('#edit-household'); click('#household-form [type="submit"]');
      assert(memory.value===before, 'Unchanged size reset shopping progress');
    });
    await test('Wizard preserves drafts, validates each step and creates only on confirmation', async () => {
      await load(null);
      assert(!find('.panel').hidden && find('.pantry-panel').hidden, 'Wrong initial step');
      click('#edit-household'); click('#people-more'); click('#household-form [type="submit"]');
      assert(find('#people').value==='5' && memory.writes===0, 'Draft household saved too early');
      click('#setup-next'); find('#otherAllergies').value='unrecognised-food'; click('#setup-next');
      assert(find('#step-status').textContent.includes('Step 2'), 'Unknown exclusion bypassed');
      find('#otherAllergies').value='chickpea'; click('#setup-next');
      find('[name="pantry"][value="paneer"]').checked=true;
      click('#setup-back'); assert(find('#otherAllergies').value==='chickpea', 'Back lost draft');
      click('#setup-next'); assert(find('[name="pantry"][value="paneer"]').checked, 'Ingredient draft lost');
      assert(memory.writes===0, 'Navigation saved before confirmation');
      click('button[type="submit"]'); assert(stored().prefs.people===5, 'Final confirmation lost household');
    });
    await test('Mobile day buttons reveal one day without changing meals', async () => {
      await load(); const before=memory.value;
      click('[data-select-day="2"]');
      const visible=[...documentInFrame().querySelectorAll('[data-menu-day]')].filter(node=>node.getClientRects().length);
      assert(visible.length===5 && visible.every(node=>node.dataset.menuDay==='2'), 'Incorrect mobile day shown');
      assert(find('[data-select-day="2"]').getAttribute('aria-pressed')==='true', 'Day state inaccessible');
      assert(find('.swap').textContent.includes('Swap') && memory.value===before, 'Day selection changed plan');
    });
    for (const width of [320, 375, 390, 768, 1200]) {
      await test(`Plan, preferences, groceries and dialog fit a ${width}px viewport`, async () => {
        await load(JSON.stringify(fixture()), width);
        noOverflow('plan');
        const win = frame.contentWindow;
        const labels = [...documentInFrame().querySelectorAll('.nav-label-text')];
        assert(labels.every(node => parseFloat(win.getComputedStyle(node).fontSize) >= 12), 'Navigation labels hidden');
        if (width <= 850) {
          const rect = find('.swap').getBoundingClientRect(); assert(rect.width >= 44 && rect.height >= 44, 'Swap target too small');
        }
        click('[data-dish]'); noOverflow('dialog'); click('.close-done');
        click('[data-view="preferences"]'); noOverflow('preferences');
        click('#setup-next'); noOverflow('food preferences'); click('#setup-next'); find('.pantry-group').open = true; noOverflow('pantry');
        click('#account-button'); noOverflow('account dialog'); click('#close-account'); click('#edit-household'); noOverflow('household dialog'); click('#cancel-household');
        click('[data-view="groceries"]'); noOverflow('groceries');
      });
    }
    await load(JSON.stringify(fixture()), 390);
  } catch (error) {
    const li = document.createElement('li'); li.className = 'fail'; li.textContent = `Runner failed: ${error.message}`; results.append(li);
  } finally {
    button.disabled = false;
    document.querySelector('#summary').textContent = `${passed} / ${total} browser checks passed`;
  }
}
document.querySelector('#run').addEventListener('click', run);

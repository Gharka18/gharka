import {restoreState,loadState,saveState,validPlan,storageKey} from '../src/state.js';
import {dishes,ingredients,meals,allergens,cuisines,catalogueVersion} from '../src/data.js';
import {defaults,generatePlan,eligible,replacement,groceryList,formatAmount,validPreferences,resolveExclusions,planSummary,emptyMealReason} from '../src/planner.js';
export function runSuite(){
const results=[];const assert=(v,m)=>{if(!v)throw new Error(m||'Assertion failed');};const test=(name,fn)=>{try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}};
test('Default week has 28 vegetarian meals',()=>{const p=generatePlan(defaults);assert(p.length===7);assert(p.every(day=>Object.values(day.meals).length===4&&Object.values(day.meals).every(id=>dishes.find(d=>d.id===id)?.diet==='Vegetarian')));});
test('Diet filters distinguish eggs and meat',()=>{for(const slot of meals){assert(eligible(defaults,slot).every(d=>d.diet==='Vegetarian'));assert(eligible({...defaults,diet:'Eggetarian'},slot).every(d=>d.diet!=='Non-Vegetarian'));}assert(eligible({...defaults,diet:'Eggetarian'},'Breakfast').some(d=>d.diet==='Eggetarian'));assert(eligible({...defaults,diet:'Non-Vegetarian'},'Lunch').some(d=>d.diet==='Non-Vegetarian'));});
test('Every tracked allergy excludes its ingredients',()=>{for(const allergy of allergens)for(const slot of meals){assert(eligible({...defaults,diet:'Non-Vegetarian',allergies:[allergy]},slot).every(d=>!d.allergens.includes(allergy)));}});
test('Hindi food aliases exclude ingredients',()=>{for(const [term,key] of [['aloo','potato'],['palak','spinach'],['dahi','curd'],['pyaz','onion'],['anda','egg']])for(const slot of meals)assert(eligible({...defaults,diet:'Non-Vegetarian',dislikes:term},slot).every(d=>!d.ingredients[key]));});
test('Custom ingredient exclusions and case are respected',()=>{assert(eligible({...defaults,otherAllergies:'COCONUT; mustard',dislikes:'onion, tomato'},'Snacks').every(d=>!['coconut','mustard','onion','tomato'].some(k=>d.ingredients[k])));});
test('Cooking limits never silently relax',()=>{for(const slot of meals)assert(eligible({...defaults,time:15},slot).every(d=>d.time<=15));const p=generatePlan({...defaults,time:15});assert(p.every(d=>d.meals.Lunch===null&&d.meals.Dinner===null));});
test('Regional choices include only selected and everyday dishes',()=>{for(const cuisine of cuisines)for(const slot of meals)assert(eligible({...defaults,cuisines:[cuisine]},slot).every(d=>[cuisine,'Everyday Indian'].includes(d.cuisine)));});
test('Selected slots are the only planned meals',()=>{assert(generatePlan({...defaults,slots:['Dinner']}).every(day=>Object.keys(day.meals).join()==='Dinner'));});
test('Replacement differs and still matches all constraints',()=>{const p={...defaults,allergies:['Dairy'],dislikes:'potato'},plan=generatePlan(p);const before=JSON.stringify(plan);const id=replacement(plan,p,0,'Lunch');assert(id!==plan[0].meals.Lunch);assert(eligible(p,'Lunch').some(d=>d.id===id));assert(JSON.stringify(plan)===before);});
test('No replacement returns null for impossible constraints',()=>{const p={...defaults,time:15};assert(replacement(generatePlan(p),p,0,'Lunch')===null);});
test('Grocery amounts aggregate repeated meals and scale exactly',()=>{const plan=[{meals:{Breakfast:'fruit',Snacks:'fruit'}}];const list=groceryList(plan,4);assert(list.find(i=>i.id==='banana').amount===8);assert(list.find(i=>i.id==='apple').amount===8);assert(list.length===2);const a=groceryList(generatePlan(defaults,()=>0),1),b=groceryList(generatePlan(defaults,()=>0),4);assert(a.every((i,n)=>Math.abs(i.amount*4-b[n].amount)<.001));});
test('Grocery list updates when a dish changes',()=>{const p=[{meals:{Snacks:'fruit'}}];assert(groceryList(p,1).some(i=>i.id==='apple'));p[0].meals.Snacks='makhana';assert(!groceryList(p,1).some(i=>i.id==='apple'));assert(groceryList(p,1).some(i=>i.id==='makhana'));});
test('Empty plans produce no groceries',()=>assert(groceryList([{meals:{Lunch:null}}],4).length===0));
test('Catalogue IDs, quantities and allergen metadata are consistent',()=>{assert(new Set(dishes.map(d=>d.id)).size===dishes.length);for(const d of dishes){assert(d.method&&d.slots.length);for(const [id,qty] of Object.entries(d.ingredients)){assert(ingredients[id]&&qty>0);assert(ingredients[id].allergens.every(a=>d.allergens.includes(a)));}}});
test('Display quantities convert to household shopping units',()=>{assert(formatAmount(1500,'g')==='1.5 kg');assert(formatAmount(2000,'ml')==='2 L');assert(formatAmount(2,'pieces')==='2 pieces');});
test('Invalid saved preferences are rejected',()=>{assert(validPreferences(defaults));for(const changes of [{people:0},{people:1.5},{people:13},{slots:[]},{slots:['Breakfast','Breakfast']},{time:0},{diet:'unknown'},{allergies:null}])assert(!validPreferences({...defaults,...changes}));});
test('Randomized plans preserve constraints across 150 households',()=>{for(let n=0;n<150;n++){const p={...defaults,diet:['Vegetarian','Eggetarian','Non-Vegetarian'][n%3],time:[15,30,45,60][n%4],allergies:[allergens[n%allergens.length]],cuisines:n%2?[cuisines[n%cuisines.length]]:[],dislikes:n%3?'':'onion'};for(const day of generatePlan(p))for(const [slot,id] of Object.entries(day.meals))assert(id===null||eligible(p,slot).some(d=>d.id===id));}});

test('Peanut names exclude peanuts without excluding non-peanut oil',()=>{
  for(const field of ['dislikes','otherAllergies'])for(const term of ['peanut','peanuts','groundnut','groundnuts']){
    const p={...defaults,[field]:term};
    const lunch=eligible(p,'Lunch');
    assert(lunch.some(d=>d.id==='dal-rice'), `${field}: ${term} must retain dal rice`);
    assert(lunch.some(d=>d.id==='curd-rice'), `${field}: ${term} must retain curd rice`);
    for(const slot of meals)assert(eligible(p,slot).every(d=>!d.ingredients.peanut));
    assert(!eligible(p,'Snacks').some(d=>d.id==='peanut-chaat'));
  }
});
test('Common plural exclusions match their singular ingredients',()=>{
  for(const field of ['dislikes','otherAllergies'])for(const [term,id] of [['onions','onion'],['tomatoes','tomato'],['potatoes','potato'],['almonds','almond'],['eggs','egg']]){
    const p={...defaults,diet:'Non-Vegetarian',[field]:term};
    for(const slot of meals){
      const actual=eligible(p,slot);
      assert(actual.every(d=>!d.ingredients[id]), `${field}: ${term} must exclude ${id}`);
      const expected=eligible({...p,[field]:id},slot).map(d=>d.id);
      assert(JSON.stringify(actual.map(d=>d.id))===JSON.stringify(expected));
    }
    assert(eligible(p,'Snacks').some(d=>d.id==='fruit'));
  }
});
test('Exclusion separators and uppercase plurals preserve valid dishes',()=>{
  const p={...defaults,otherAllergies:'  ONIONS;\n TOMATOES, potatoes  '};
  assert(eligible(p,'Lunch').some(d=>d.id==='khichdi'));
  for(const slot of meals)assert(eligible(p,slot).every(d=>!d.ingredients.onion&&!d.ingredients.tomato&&!d.ingredients.potato));
});
test('Unrecognised exclusions cannot silently allow meals',()=>{
  for(const field of ['dislikes','otherAllergies']){
    const p={...defaults,[field]:'unknown-food'};
    for(const slot of meals)assert(eligible(p,slot).length===0);
    const plan=generatePlan(p);
    assert(plan.every(day=>Object.values(day.meals).every(id=>id===null)));
    assert(replacement(plan,p,0,'Lunch')===null);
  }
});
test('Free-text dairy and wheat exclusions cover their ingredient families',()=>{
  for(const [term,tag] of [['milk','Dairy'],['dairy','Dairy'],['wheat','Gluten'],['gluten','Gluten']]){
    const p={...defaults,otherAllergies:term};
    assert(eligible(p,'Snacks').some(d=>d.id==='fruit'));
    for(const slot of meals)assert(eligible(p,slot).every(d=>!d.allergens.includes(tag)), `${term} must exclude ${tag}`);
  }
});
test('Rice exclusions include rice-based batter and poha',()=>{
  const p={...defaults,otherAllergies:'rice'};
  assert(eligible(p,'Breakfast').some(d=>d.id==='besan-chilla'));
  for(const slot of meals)assert(eligible(p,slot).every(d=>!['rice','poha','batter'].some(id=>d.ingredients[id])));
});
test('Ingredient matching does not confuse peas with peanuts',()=>{
  const p={...defaults,otherAllergies:'peas'};
  assert(eligible(p,'Snacks').some(d=>d.id==='peanut-chaat'));
  assert(!eligible(p,'Lunch').some(d=>d.id==='pulao'));
});
test('Generation and replacements preserve combined restrictions independently',()=>{
  for(const diet of ['Vegetarian','Eggetarian','Non-Vegetarian'])for(const random of [()=>0,()=>0.5,()=>0.99]){
    const p={...defaults,diet,allergies:['Dairy','Peanuts'],otherAllergies:'onions, tomatoes'};
    const check=d=>{
      assert(d&&!d.ingredients.onion&&!d.ingredients.tomato&&!d.ingredients.peanut);
      assert(!d.allergens.includes('Dairy')&&!d.allergens.includes('Peanuts'));
      if(diet==='Vegetarian')assert(d.diet==='Vegetarian');
      if(diet==='Eggetarian')assert(d.diet!=='Non-Vegetarian');
    };
    const plan=generatePlan(p,random);
    assert(plan.every(day=>Object.values(day.meals).every(Boolean)), 'This supported combination must have a complete plan');
    for(const day of plan)for(const id of Object.values(day.meals))check(dishes.find(d=>d.id===id));
    for(let day=0;day<7;day++)for(const slot of meals){
      const id=replacement(plan,p,day,slot,random);
      if(id){assert(id!==plan[day].meals[slot]);check(dishes.find(d=>d.id===id));}
    }
  }
});

test('Unknown terms are reported and recognised terms still resolve',()=>{
  const result=resolveExclusions({...defaults,otherAllergies:' ONIONS, unknown-food, tomatoes '});
  assert(JSON.stringify(result.unknown)===JSON.stringify(['unknown food']));
  assert(result.ingredients.has('onion')&&result.ingredients.has('tomato'));
});
test('Every catalogue ingredient ID is recognised as an exclusion',()=>{
  for(const id of Object.keys(ingredients)){
    const p={...defaults,diet:'Non-Vegetarian',otherAllergies:id};
    assert(resolveExclusions(p).unknown.length===0, id);
    for(const slot of meals)assert(eligible(p,slot).every(d=>!d.ingredients[id]), id);
  }
});
test('Unrecognised saved allergy labels block suggestions',()=>{
  const p={...defaults,allergies:['unknown-allergen']};
  assert(resolveExclusions(p).unknown.length===1);
  assert(eligible(p,'Lunch').length===0);
});
test('Exact dish dislikes remove the dish and retain other choices',()=>{
  const p={...defaults,dislikes:'Kanda poha'};
  const breakfast=eligible(p,'Breakfast');
  assert(!breakfast.some(d=>d.id==='kanda-poha'));
  assert(breakfast.some(d=>d.id==='besan-chilla'));
});

test('Cold dishes and steamed idli contain only their explicit ingredients',()=>{
  const expected={sandwich:['bread','cucumber','tomato','curd','salt','pepper'],'carrot-chaat':['carrot','cucumber','lemon','coriander','salt'],idli:['batter','coconut','moong','salt'],fruit:['apple','banana']};
  for(const [id,keys] of Object.entries(expected))assert(JSON.stringify(Object.keys(dishes.find(d=>d.id===id).ingredients).sort())===JSON.stringify(keys.sort()),id);
});
test('Known grocery fixture gives exact category, quantity and no phantom spices',()=>{
  const plan=[{meals:{Breakfast:'sandwich',Snacks:'carrot-chaat'}},{meals:{Snacks:'carrot-chaat'}}];
  const list=groceryList(plan,4),byId=Object.fromEntries(list.map(i=>[i.id,i]));
  assert(byId.cucumber.amount===1000&&byId.cucumber.category==='Vegetables');
  assert(byId.bread.amount===8&&byId.bread.unit==='slices');
  assert(byId.lemon.amount===2&&byId.curd.amount===120);
  assert(byId.salt.amount===6&&byId.pepper.amount===.8);
  assert(!byId.oil&&!byId.turmeric&&!byId.cumin&&!byId.chilli);
});
test('Fractional ingredients scale correctly for one through twelve people',()=>{
  for(let people=1;people<=12;people++){
    const list=groceryList([{meals:{Snacks:'carrot-chaat'}}],people);
    assert(list.find(i=>i.id==='lemon').amount===.25*people);
    assert(list.find(i=>i.id==='salt').amount===.5*people);
  }
  assert(formatAmount(1005,'g')==='1.005 kg');
});
test('A single eligible meal cannot be replaced or mutated',()=>{
  const p={...defaults,slots:['Breakfast'],cuisines:['North Indian'],time:15};
  assert(eligible(p,'Breakfast').length===1);
  const plan=generatePlan(p),before=JSON.stringify(plan);
  assert(replacement(plan,p,0,'Breakfast')===null);
  assert(JSON.stringify(plan)===before);
});
test('Successful replacement changes grocery contribution for only one slot',()=>{
  const plan=generatePlan(defaults,()=>0),before=structuredClone(plan),id=replacement(plan,defaults,0,'Breakfast',()=>.99);
  assert(id&&id!==plan[0].meals.Breakfast);
  plan[0].meals.Breakfast=id;
  let changed=0;for(let day=0;day<7;day++)for(const slot of meals)if(plan[day].meals[slot]!==before[day].meals[slot])changed++;
  assert(changed===1);
  const total=Object.fromEntries(groceryList(plan,4).map(i=>[i.id,i.amount]));
  const old=dishes.find(d=>d.id===before[0].meals.Breakfast),next=dishes.find(d=>d.id===id);
  for(const i of groceryList(before,4))assert(Math.abs((total[i.id]||0)-(i.amount-(old.ingredients[i.id]||0)*4+(next.ingredients[i.id]||0)*4))<.001);
});
test('Incomplete plans report counts and explain time without relaxing restrictions',()=>{
  const p={...defaults,time:15},summary=planSummary(generatePlan(p));
  assert(summary.total===28&&summary.planned===14&&summary.missing===14);
  assert(emptyMealReason(p,'Lunch').includes('15-minute'));
  assert(emptyMealReason({...p,otherAllergies:'unknown-food'},'Lunch').includes('unrecognised'));
});
const storedFixture=()=>({version:1,catalogueVersion,prefs:structuredClone(defaults),plan:generatePlan(defaults,()=>0),checked:[]});
test('Current saved state restores exact meals and valid deduplicated checkmarks',()=>{
  const saved=storedFixture();const id=groceryList(saved.plan,4)[0].id;saved.checked=[id,id,'not-an-ingredient',123];
  const state=restoreState(JSON.stringify(saved));
  assert(JSON.stringify(state.plan)===JSON.stringify(saved.plan));
  assert(JSON.stringify(state.checked)===JSON.stringify([id]));
  assert(!state.needsPreferences&&!state.recoveryNotice);
});
test('Invalid saved plans regenerate under saved restrictions and clear checkmarks',()=>{
  for(const invalid of [[],[null],Array(7).fill({day:'Monday',meals:{}})]){
    const saved=storedFixture();saved.prefs.allergies=['Dairy'];saved.plan=invalid;saved.checked=['milk'];
    const state=restoreState(JSON.stringify(saved));
    assert(!state.needsPreferences&&state.recoveryNotice&&state.checked.length===0);
    assert(state.prefs.allergies.includes('Dairy'));
    assert(state.plan.every(day=>Object.values(day.meals).every(id=>!id||!dishes.find(d=>d.id===id).allergens.includes('Dairy'))));
  }
});
test('Malformed storage requires confirmation instead of inventing dietary preferences',()=>{
  for(const raw of ['{broken','null',JSON.stringify({prefs:{diet:'Vegetarian'}})]){
    const state=restoreState(raw);
    assert(state.needsPreferences&&state.recoveryNotice);
    assert(planSummary(state.plan).planned===0);
    let writes=0;saveState(()=>writes++,state);assert(writes===0);
  }
});
test('Unknown saved option values require preference confirmation',()=>{
  for(const change of [{cuisines:['<b>unknown</b>']},{allergies:['unknown']},{people:0}]){
    const saved=storedFixture();saved.prefs={...saved.prefs,...change};
    assert(restoreState(JSON.stringify(saved)).needsPreferences);
  }
});
test('Unavailable storage keeps the page usable without assuming saved restrictions',()=>{
  const state=loadState(()=>{throw new Error('blocked');});
  assert(state.needsPreferences&&state.storageWarning&&state.checked.length===0);
});
test('Write failures return a warning and do not mutate the live state',()=>{
  const state=restoreState(null),before=JSON.stringify(state);
  assert(saveState(()=>{throw new Error('quota');},state).includes('could not be saved'));
  assert(JSON.stringify(state)===before);
  let record;assert(saveState((key,value)=>{assert(key===storageKey);record=JSON.parse(value);},state)==='');
  assert(record.version===1&&record.catalogueVersion===catalogueVersion);
});
test('Catalogue changes keep the menu but invalidate shopping checkmarks',()=>{
  const saved=storedFixture();saved.catalogueVersion=1;saved.checked=['rice'];
  const state=restoreState(JSON.stringify(saved));
  assert(JSON.stringify(state.plan)===JSON.stringify(saved.plan));
  assert(state.checked.length===0&&state.recoveryNotice.includes('quantities'));
});
test('Stale empty slots are regenerated when eligible dishes exist',()=>{
  const saved=storedFixture();saved.plan[0].meals.Breakfast=null;
  assert(!validPlan(saved.plan,saved.prefs));
  assert(restoreState(JSON.stringify(saved)).plan[0].meals.Breakfast);
});
test('Unresolved saved exclusions remain blocked during recovery',()=>{
  const saved=storedFixture();saved.prefs.otherAllergies='unknown-food';
  const state=restoreState(JSON.stringify(saved));
  assert(state.prefs.otherAllergies==='unknown-food');
  assert(planSummary(state.plan).planned===0&&state.checked.length===0);
});
return results;
}

import { dishes, ingredients, meals, allergens, cuisines } from './data.js';
export const defaults = {diet:'Vegetarian',people:4,slots:[...meals],cuisines:[],dislikes:'',allergies:[],otherAllergies:'',time:45,pantry:[]};
export const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// Match recognised ingredient identities, never words inside descriptive labels.
const aliases = {
  aloo: ['potato'], gobi: ['cauliflower'], palak: ['spinach'], dahi: ['curd'],
  doodh: ['milk', 'curd', 'paneer'], anda: ['egg'], ande: ['egg'],
  nuts: ['almond', 'peanut'], groundnut: ['peanut'],
  wheat: ['atta', 'bread', 'rava', 'vermicelli'],
  milk: ['milk', 'curd', 'paneer'], lactose: ['milk', 'curd', 'paneer'],
  rice: ['rice', 'poha', 'batter'], soya: ['soy'], pyaaz: ['onion'],
  pyaz: ['onion'], tamatar: ['tomato'], dhaniya: ['coriander'],
  pea: ['peas'], 'green pea': ['peas'], bean: ['beans'], 'green bean': ['beans'],
  'curry leaf': ['curry'], 'curry leaves': ['curry'],
  'sesame seed': ['sesame'], 'mustard seed': ['mustard'],
  yogurt: ['curd'], yoghurt: ['curd'], semolina: ['rava'],
  'soy chunk': ['soy'], 'soya chunk': ['soy'],
  'idli batter': ['batter'], 'dosa batter': ['batter']
};
// Explicit food families, not word fragments. Chickpea flour exclusions are
// conservative in both free-text fields: all listed chickpea forms are excluded.
// Other entries name a specific catalogue ingredient (or a known batter component).
const ingredientAliasGroups = [
  { ids: ['chana', 'besan'], names: ['chana', 'besan', 'chickpea', 'kabuli chana',
    'garbanzo bean', 'chickpea flour', 'gram flour', 'besan flour', 'chana dal',
    'bengal gram', 'चना', 'बेसन'] },
  { ids: ['moong'], names: ['mung', 'mung bean', 'mung dal', 'green gram'] },
  { ids: ['toor'], names: ['arhar', 'arhar dal', 'tuvar', 'tuvar dal', 'pigeon pea'] },
  { ids: ['masoor'], names: ['red lentil'] },
  { ids: ['rajma'], names: ['kidney bean'] },
  { ids: ['batter'], names: ['urad', 'urad dal', 'black gram'] },
  { ids: ['rava'], names: ['suji', 'sooji', 'सूजी'] }
];
const normaliseTerm = value => value.normalize('NFKC').toLowerCase()
  .replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
const exclusionIndex = new Map();

function registerExclusion(name, type, ids) {
  const term = normaliseTerm(name);
  const forms = [term, `${term}s`];
  if (term.endsWith('o')) forms.push(`${term}es`);
  if (/[^aeiou]y$/.test(term)) forms.push(`${term.slice(0, -1)}ies`);
  for (const form of forms) {
    if (!exclusionIndex.has(form)) {
      exclusionIndex.set(form, { ingredients: new Set(), allergens: new Set(), dishes: new Set() });
    }
    ids.forEach(id => exclusionIndex.get(form)[type].add(id));
  }
}

for (const ingredient of Object.values(ingredients)) {
  registerExclusion(ingredient.id, 'ingredients', [ingredient.id]);
  // Ignore parenthetical descriptions such as "non-peanut" and "dry equivalent".
  const name = ingredient.name.replace(/\([^)]*\)/g, '').trim();
  registerExclusion(name, 'ingredients', [ingredient.id]);
  name.split('/').forEach(part => registerExclusion(part, 'ingredients', [ingredient.id]));
}
for (const [name, ids] of Object.entries(aliases)) registerExclusion(name, 'ingredients', ids);
for (const { names, ids } of ingredientAliasGroups) {
  for (const name of names) registerExclusion(name, 'ingredients', ids);
}
for (const allergen of allergens) registerExclusion(allergen, 'allergens', [allergen]);
for (const dish of dishes) {
  registerExclusion(dish.id, 'dishes', [dish.id]);
  registerExclusion(dish.name, 'dishes', [dish.id]);
}

export function exclusionTerms(p) {
  return [...new Set(`${p.dislikes},${p.otherAllergies}`.split(/[,;\n]/)
    .map(normaliseTerm).filter(Boolean))];
}

export function resolveExclusions(p) {
  const excluded = { ingredients: new Set(), allergens: new Set(), dishes: new Set(), unknown: [] };
  for (const term of exclusionTerms(p)) {
    const match = exclusionIndex.get(term);
    if (!match) {
      excluded.unknown.push(term);
      continue;
    }
    for (const type of ['ingredients', 'allergens', 'dishes']) {
      match[type].forEach(id => excluded[type].add(id));
    }
  }
  for (const allergen of p.allergies) {
    if (allergens.includes(allergen)) excluded.allergens.add(allergen);
    else excluded.unknown.push(String(allergen));
  }
  return excluded;
}

export function eligible(p, slot) {
  const excluded = resolveExclusions(p);
  // An unrecognised restriction must never be treated as successfully applied.
  if (excluded.unknown.length) return [];
  return dishes.filter(d => d.slots.includes(slot) && d.time <= p.time
    && (p.diet === 'Non-Vegetarian' || d.diet === 'Vegetarian'
      || (p.diet === 'Eggetarian' && d.diet === 'Eggetarian'))
    && (!p.cuisines.length || p.cuisines.includes(d.cuisine) || d.cuisine === 'Everyday Indian')
    && !excluded.dishes.has(d.id)
    && !d.allergens.some(a => excluded.allergens.has(a))
    && !Object.keys(d.ingredients).some(id => excluded.ingredients.has(id)));
}
// Only rank already-eligible candidates. No soft preference removes a meal.
// Ignore the target slot so replacement does not count the departing dish.
export function rankCandidates(candidates, plan, dayIndex, slot, pantry = []) {
  const context = plan.flatMap((day, index) => Object.entries(day.meals)
    .filter(([key]) => index !== dayIndex || key !== slot)
    .map(([, id]) => ({ index, dish: dishes.find(d => d.id === id) }))
    .filter(entry => entry.dish));
  const overlap = (a, b) => a.filter(tag => b.includes(tag)).length;
  const ranked = candidates.map(dish => {
    const score = [0, 0, 0, 0, 0, -Object.keys(dish.ingredients).filter(id => pantry.includes(id)).length];
    for (const { index, dish: other } of context) {
      const same = dish.id === other.id;
      const majors = overlap(dish.variety.majorIngredients, other.variety.majorIngredients);
      const families = overlap(dish.variety.families, other.variety.families);
      if (index === dayIndex) {
        score[0] += Number(same);
        score[1] += majors;
      }
      score[2] += Number(same);
      if (Math.abs(index - dayIndex) === 1) score[3] += Number(same || families > 0);
      score[4] += majors + families;
    }
    return { dish, score };
  });
  ranked.sort((a, b) => {
    for (let i = 0; i < a.score.length; i++) {
      if (a.score[i] !== b.score[i]) return a.score[i] - b.score[i];
    }
    return a.dish.id < b.dish.id ? -1 : a.dish.id > b.dish.id ? 1 : 0;
  });
  return ranked.map(entry => entry.dish);
}

export function generatePlan(p) {
  const pools = Object.fromEntries(p.slots.map(slot => [slot, eligible(p, slot)]));
  // Most constrained first; canonical order breaks ties independently of input order.
  const order = [...p.slots].sort((a, b) => pools[a].length - pools[b].length
    || meals.indexOf(a) - meals.indexOf(b));
  const plan = days.map(day => ({ day, meals: Object.fromEntries(p.slots.map(slot => [slot, null])) }));
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    for (const slot of order) {
      plan[dayIndex].meals[slot] = rankCandidates(pools[slot], plan, dayIndex, slot, p.pantry)[0]?.id || null;
    }
  }
  return plan;
}

export function replacement(plan, p, dayIndex, slot) {
  const current = plan[dayIndex].meals[slot];
  const pool = eligible(p, slot).filter(d => d.id !== current);
  return rankCandidates(pool, plan, dayIndex, slot, p.pantry)[0]?.id || null;
}
export function groceryList(plan,people){
 const totals={};
 plan.forEach(day=>Object.values(day.meals).forEach(id=>{
 const dish=dishes.find(d=>d.id===id); if(!dish)return;
 Object.entries(dish.ingredients).forEach(([key,amount])=>{totals[key]=(totals[key]||0)+amount*people;});
 }));
 return Object.entries(totals).map(([id,amount])=>({...ingredients[id],amount:Math.round(amount*1000)/1000})).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
}
export function formatAmount(amount,unit){if((unit==='g'||unit==='ml')&&amount>=1000)return `${+(amount/1000).toFixed(3)} ${unit==='g'?'kg':'L'}`;return `${+amount.toFixed(2)} ${unit}`;}
export function validPreferences(p) {
  return Boolean(p && ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'].includes(p.diet)
    && Number.isInteger(p.people) && p.people >= 1 && p.people <= 12
    && Array.isArray(p.slots) && p.slots.length > 0 && p.slots.every(x => meals.includes(x))
    && new Set(p.slots).size === p.slots.length
    && Array.isArray(p.cuisines) && p.cuisines.every(x => cuisines.includes(x))
    && Array.isArray(p.allergies) && p.allergies.every(x => allergens.includes(x))
    && typeof p.dislikes === 'string' && typeof p.otherAllergies === 'string'
    && (p.pantry === undefined || (Array.isArray(p.pantry)
      && p.pantry.every(id => typeof id === 'string' && Object.hasOwn(ingredients, id))
      && new Set(p.pantry).size === p.pantry.length))
    && [15, 30, 45, 60].includes(p.time));
}

export function planSummary(plan) {
  const slots = plan.flatMap(day => Object.values(day.meals));
  return { total: slots.length, planned: slots.filter(Boolean).length, missing: slots.filter(id => !id).length };
}

export function emptyMealReason(p, slot) {
  if (resolveExclusions(p).unknown.length) return 'Clarify the unrecognised exclusions in My preferences before planning meals.';
  if (eligible({ ...p, time: 60 }, slot).length) {
    return `No ${slot.toLowerCase()} fits the ${p.time}-minute limit with your other choices. Try a longer cooking time.`;
  }
  if (p.cuisines.length && eligible({ ...p, cuisines: [] }, slot).length) {
    return `No ${slot.toLowerCase()} matches these cuisines and restrictions. Try including more cuisines.`;
  }
  return `Our catalogue has no ${slot.toLowerCase()} matching all your choices. Your dietary restrictions and allergies have been kept.`;
}

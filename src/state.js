import { catalogueVersion } from './data.js';
import { defaults, days, validPreferences, eligible, generatePlan, groceryList, resolveExclusions } from './planner.js';

export const storageKey = 'gharka-v1';
const blankPlan = p => days.map(day => ({ day, meals: Object.fromEntries(p.slots.map(slot => [slot, null])) }));

export function validPlan(plan, prefs) {
  if (!Array.isArray(plan) || plan.length !== days.length) return false;
  const pools = Object.fromEntries(prefs.slots.map(slot => [slot, new Set(eligible(prefs, slot).map(d => d.id))]));
  return plan.every((day, index) => day && day.day === days[index] && day.meals
    && typeof day.meals === 'object' && !Array.isArray(day.meals)
    && Object.keys(day.meals).length === prefs.slots.length
    && prefs.slots.every(slot => Object.hasOwn(day.meals, slot)
      && (day.meals[slot] === null ? pools[slot].size === 0 : pools[slot].has(day.meals[slot]))));
}

function confirmationState(message, storageWarning = '') {
  const prefs = structuredClone(defaults);
  return { prefs, plan: blankPlan(prefs), checked: [], needsPreferences: true, recoveryNotice: message, storageWarning };
}

export function restoreState(raw, random = Math.random) {
  if (raw === null) {
    const prefs = structuredClone(defaults);
    return { prefs, plan: generatePlan(prefs, random), checked: [], needsPreferences: false, recoveryNotice: '', storageWarning: '' };
  }
  let saved;
  try { saved = JSON.parse(raw); } catch {
    return confirmationState('Your saved information could not be read. Confirm your dietary preferences to create a new week.');
  }
  if (!saved || !validPreferences(saved.prefs) || (saved.version !== undefined && saved.version !== 1)) {
    return confirmationState('Your saved preferences could not be restored safely. Review and save your choices before planning meals.');
  }
  const prefs = structuredClone(saved.prefs);
  const restored = { prefs, plan: [], checked: [], needsPreferences: false, recoveryNotice: '', storageWarning: '' };
  if (!validPlan(saved.plan, prefs)) {
    restored.plan = generatePlan(prefs, random);
    restored.recoveryNotice = resolveExclusions(prefs).unknown.length
      ? 'Meal suggestions are paused until your saved exclusions are clarified.'
      : 'Your saved menu no longer matches your preferences or the catalogue. A new week was created with your restrictions, and shopping checkmarks were cleared.';
    return restored;
  }
  restored.plan = saved.plan;
  if (saved.catalogueVersion !== catalogueVersion) {
    restored.recoveryNotice = 'Recipe quantities have been updated. Your menu was kept; shopping checkmarks were cleared so you can review the grocery list.';
    return restored;
  }
  const ids = new Set(groceryList(restored.plan, prefs.people).map(item => item.id));
  restored.checked = Array.isArray(saved.checked) ? [...new Set(saved.checked.filter(id => ids.has(id)))] : [];
  return restored;
}

export function loadState(read, random = Math.random) {
  try { return restoreState(read(storageKey), random); } catch {
    return confirmationState('Confirm your dietary preferences before creating a week.', 'Browser storage could not be accessed. You can plan meals after confirming your choices, but your changes may not survive a refresh.');
  }
}

export function saveState(write, state) {
  if (state.needsPreferences) return '';
  try {
    write(storageKey, JSON.stringify({ version: 1, catalogueVersion, prefs: state.prefs, plan: state.plan, checked: state.checked }));
    return '';
  } catch {
    return 'Your latest changes could not be saved in this browser. They are still available on this page, but may be lost on refresh. Try saving again.';
  }
}

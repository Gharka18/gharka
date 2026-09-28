# GharKa — your everyday Indian meal planner

A working first version that helps Indian households answer “Aaj kya banaye?”

## Try it

Open **http://127.0.0.1:5173** while the local server is running.

To start it again, open Terminal in this folder and run:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Keep that Terminal window open. Press Control+C when you want to stop the server. Open the address in Safari, Chrome or another current browser; do not double-click `index.html`, because JavaScript modules need the local server.

No Node installation, package installation, account, or API key is required for guest meal planning. Python 3 is already available on this computer.

## Try the main features

1. On first use, complete the household setup before any meals are generated. Returning users can open **My preferences**. Choose diet, family size, meals, cuisines, dislikes, allergies and cooking time. Select ingredients already at home, then choose **Create my week** (or **Save & create my week** for a returning household).
2. Browse seven days. Use the **↻** beside a meal to replace only that dish. Click its name for ingredients and cooking notes.
3. Open **Grocery list**. Ingredients from the whole week are combined and scaled for your household. Tick purchased items or choose **Download list** for a text file.
4. Refresh the page. Your household preferences, plan and grocery checkmarks remain saved in this browser.
5. Try a 15-minute limit: unavailable lunches or dinners show a helpful empty state. Filters are never silently relaxed.

Swapping a dish or generating a new week clears grocery checkmarks because quantities may change. Updated recipe quantities also clear old shopping ticks once.

If saved preferences cannot be read, the app asks you to confirm them before suggesting meals. Failed saves show a warning and a retry button; keep the page open until saving succeeds.

## Stack and project structure

Plain HTML, CSS and JavaScript modules; a curated catalogue; browser localStorage. This deliberately keeps the first release small and inexpensive. No backend or build step. Optional Google Fonts have system-font fallbacks; no preference data is sent to a service.

```text
index.html             Entry page
src/
  boot.js              Visible fallback for startup errors
  app.js               Screens, events and downloads
  state.js             Saved-state validation, recovery and persistence
  styles.css           Responsive layout and visual design
  data.js              46 Indian dishes and ingredient catalogue
  planner.js           Filtering, generation, swaps, grocery calculations
 tests/
  suite.js             Shared automated checks
  index.html           Run checks in a browser
  planner.test.js      Optional Node test runner
  browser.html/js      Isolated automated browser interaction checks
 docs/
  MVP.md               Scope, defaults, recommended stack, next releases
  TESTING.md           Verification and manual test checklist
```

## Automated checks

With the server running, open **http://127.0.0.1:5173/tests/**. It runs the same 73 checks used for planner verification. If Node is installed later, you can also run `npm test` without installing packages.

Open **http://127.0.0.1:5173/tests/browser.html** and select **Run browser checks** for 25 additional checks covering screen interactions, recovery and responsive layouts. These use isolated memory storage and do not change your saved household.

## First-version boundaries

- Plans remain local: no shared households, cloud backup or cross-device sync. Optional email sign-in requires Supabase configuration; guest access works without it. Guest and account plans use separate browser storage keys. Clearing browser storage removes saved data.
- Suggestions use rules and a curated catalogue, rather than a remote AI service. A selected cuisine limits regional dishes; everyday Indian options remain available.
- Diets indicate allowed foods, not a required frequency of eggs or meat. Limited matching dishes can repeat.
- Cooking times assume soaked pulses and prepared batter where mentioned. Quantities are approximate adult servings. Cooking notes are brief starting points, not fully tested recipes or medical/nutritional advice.
- Allergy filters cover listed ingredients and common allergens. Other exclusions resolve recognised ingredient names, common plurals, and aliases. Chickpea/chana/besan and their supported flour names exclude both whole chickpeas and besan; named pulse and suji/sooji aliases are also supported. Unrecognised exclusions block saving a new plan and must be clarified; packaged-food ingredients cannot be exhaustively interpreted. Review product labels and preparation.
- The responsive design includes stacked meal cards for phones. Safari checks cover 320, 375, 390, 768 and 1200 pixel viewports; real-phone verification is still a manual follow-up.

Read [the MVP plan](docs/MVP.md) for scope and future phases. The app is ready for a local pilot; it has not been published online.

Meal Variety V1 uses reviewed major-ingredient and dish-family labels in `src/variety-data.js`. Generation and Swap share a deterministic ranking: same-day duplicates, same-day major overlap, weekly dish count, adjacent families, weekly major/family use, then dish ID. Restrictions always win; valid repeats beat empty slots. Regenerating unchanged preferences currently returns the same week. There is no rice/roti balancing.

## Sign-in and first-time setup

The **Sign in** button offers an email link when the project is configured, with **Continue as guest** always available. `src/auth-config.js` intentionally contains blank public settings until the owner supplies a Supabase project URL and publishable key. No email is sent or successful login simulated without a provider. Follow [SIGN_IN_SETUP.md](docs/SIGN_IN_SETUP.md) to activate it.

New visitors answer household preferences and optionally select ingredients at home before creating a plan. **Plan a new week** opens those questions rather than immediately replacing the saved plan. Pantry ingredients are a soft tie-breaker after variety; they never relax diet, allergies, dislikes, cuisine or cooking time. Groceries and downloads mark ingredients already at home but keep full required quantities, because stock quantities are not collected.

The maintained Supabase JS client (2.117.2) is loaded from jsDelivr only when configured. It handles email-link sessions and sign-out; it does not upload meal plans. The app remains vanilla JavaScript without a build step.

### Local interface improvements

- Use **Edit** beside My household to change the number of people (1–12). Existing meals stay unchanged; grocery quantities scale and shopping checkmarks reset only when the size changes. During setup, editing changes only the draft.
- Setup has three steps: Household → Preferences → Ingredients. Back keeps your draft. A plan is saved only after the final confirmation.
- On phones, choose a day above the menu. Desktop keeps the full weekly grid. Every replacement button is labelled **Swap**.
- Grocery categories separate **To check / buy** from **Already at home**. Check stock against the full weekly quantities.

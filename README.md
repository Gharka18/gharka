# GharKa — your everyday Indian meal planner

A working first version that helps Indian households answer “Aaj kya banaye?”

## Try it

Open **http://127.0.0.1:5173** while the local server is running.

To start it again, open Terminal in this folder and run:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Keep that Terminal window open. Press Control+C when you want to stop the server. Open the address in Safari, Chrome or another current browser; do not double-click `index.html`, because JavaScript modules need the local server.

No Node installation, package installation, account, or API key is required. Python 3 is already available on this computer.

## Try the main features

1. Open **My preferences**. Choose diet, family size, meals, cuisines, dislikes, allergies and cooking time. Select **Save & create my week**.
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

With the server running, open **http://127.0.0.1:5173/tests/**. It runs the same 44 checks used for planner verification. If Node is installed later, you can also run `npm test` without installing packages.

Open **http://127.0.0.1:5173/tests/browser.html** and select **Run browser checks** for 16 additional checks covering screen interactions, recovery and responsive layouts. These use isolated memory storage and do not change your saved household.

## First-version boundaries

- Local only: no sign-in, shared household accounts or cloud backups. Clearing browser storage removes saved data.
- Suggestions use rules and a curated catalogue, rather than a remote AI service. A selected cuisine limits regional dishes; everyday Indian options remain available.
- Diets indicate allowed foods, not a required frequency of eggs or meat. Limited matching dishes can repeat.
- Cooking times assume soaked pulses and prepared batter where mentioned. Quantities are approximate adult servings. Cooking notes are brief starting points, not fully tested recipes or medical/nutritional advice.
- Allergy filters cover listed ingredients and common allergens. Other exclusions resolve recognised ingredient names, common plurals, and aliases. Unrecognised exclusions block saving a new plan and must be clarified; packaged-food ingredients cannot be exhaustively interpreted. Review product labels and preparation.
- The responsive design includes stacked meal cards for phones. Safari checks cover 320, 375, 390, 768 and 1200 pixel viewports; real-phone verification is still a manual follow-up.

Read [the MVP plan](docs/MVP.md) for scope and future phases. The app is ready for a local pilot; it has not been published online.

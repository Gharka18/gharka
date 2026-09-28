# Verification — 27 September 2026

## Guided setup, ingredients at home and optional email sign-in — 28 September 2026

- Shared suite: **73/73 passed** in Safari and the available JavaScript runtime (68 prior checks, with the save-failure fixture updated to an existing confirmed household, plus five new checks).
- Browser suite: **29/29 passed** in Safari (18 existing plus seven new checks). Existing recovery assertions now expect the preference-first screen. Viewport checks also open the pantry and sign-in dialog at 320, 375, 390, 768 and 1200 pixels.
- New coverage: no first-use plan/write before confirmation; legacy preference compatibility; pantry validation/tie-breaking and hard restrictions; unchanged grocery arithmetic; separate guest/account storage keys; new-week review without early replacement; grocery/download stock labels; guest access; provider configuration, email-link redirects, sessions, logout and provider failures through an injected fake provider.
- Manually inspected the first-use setup screen on a separate localhost origin without changing the saved 127.0.0.1 household. The sign-in button is visible and setup precedes all meals.
- The pinned Supabase JS CDN endpoint returned HTTP 200 with JavaScript content and cross-origin permission. This checks availability only, not a live authentication session.
- Live email delivery, SMTP, real magic-link callbacks, expiry/resend behaviour and real account-switch persistence are **not verified**: the owner must create/configure the Supabase project. `auth-config.js` remains blank; email login is explicitly unavailable until configured, while guests work. See `SIGN_IN_SETUP.md`.
- No Node/npm runner, real-phone or screen-reader checks were performed. No commit or deployment was made in this change.


## Meal Variety Engine V1 — 28 September 2026

- Chrome `/tests/`, with cache-bypassing reload: **68/68 passed** (52 existing + 16 new). Also passed in the available JavaScript runtime. Node/npm are unavailable, so `npm test` was not run.
- Chrome `/tests/browser.html`: **18/18 passed** (17 existing + one new same-day chickpea Swap/reload regression), using isolated memory storage.
- New shared checks cover metadata completeness, same-day dish/major overlap, safe repeated fallback, weekly usage, adjacent families in both directions, minor besan, multiple majors, deterministic/pure ranking, slot order, all hard filters, repeated swaps, independent grocery totals, and restoring safe low-variety saved plans.
- Inspected all seven generated days for five profiles, with four people and all slots. Results below count conflicts using the reviewed major labels, not every ingredient shared by recipes. This is a manual review of generated data, not a nutrition or home-cook assessment.

| Profile | Filled | Distinct dishes | Same-day major conflicts | Observations |
|---|---:|---:|---:|---|
| Default vegetarian, 45 min | 28/28 | 28 | 0 | Monday: besan chilla, aloo gobi, carrot chaat, Bengali dal. |
| Vegetarian, 30 min | 28/28 | 24 | 0 | Four necessary main-meal repeats; all ten eligible main dishes used. |
| Gujarati vegetarian, 45 min | 28/28 | 11 | 0 | Oats/thepla alternate; four main dishes recur; Everyday Indian remains eligible. Thepla and dhokla can coexist. |
| Eggetarian, 45 min | 28/28 | 28 | 0 | Four egg dishes spread across Tuesday, Friday, Saturday and Sunday. |
| Non-vegetarian, 45 min | 28/28 | 28 | 0 | Chicken/fish Tuesday; chicken pulao Sunday; eggs also allowed. No meat frequency target. |

The chana regression fixture fixes lunch to usal and offers sundal/makhana for snacks: makhana wins every day, even if already used. With sundal as the only eligible snack, both chickpea meals remain rather than leaving a slot empty. Browser coverage swaps a saved conflicting Monday and verifies the rest of the plan survives unchanged.

Limitations: deterministic regeneration repeats the same week; repeated swaps may cycle; greedy ranking can leave adjacent family repeats; no past-week memory or base balancing. Labels require continued editorial review. Existing UI, recipe amounts, eligibility/exclusion code and storage validation were not changed. No real-device, screen-reader or additional browser-engine validation was performed in this task.


## Ingredient exclusion matching — 28 September 2026

- Scope: exact ingredient aliases/families, regression checks and matching documentation only. No recipe, UI, storage, dependency or framework changes.
- Chickpea, chana, besan and supported flour names now exclude both `chana` and `besan` in dislikes and other ingredient exclusions. This deliberately treats even flour-specific input conservatively. Added exact aliases for mung/green gram, arhar/pigeon pea, red lentil, kidney bean, urad/black gram in batter, and suji/sooji.
- Added eight shared checks: chickpea/chana family; besan/flour family; case/spacing/separators/Hindi names; named pulses; suji/sooji; substring/ambiguous-name rejection and exact-dish preservation; generation/repeated swaps with combined restrictions; saved-plan revalidation.
- Before changing the matcher, seven new checks failed and one passed; all original 44 passed (45/52 total). After the fix, **52/52 passed** in the JavaScript runtime and Chrome at `/tests/` after a cache-bypassing reload.
- Added one browser regression covering chickpea form submission, eight breakfast swaps, grocery exclusion and reload. **17/17 browser checks passed** in Chrome at `/tests/browser.html`, including all previous 16 checks. Test storage remains isolated from the user's household.
- Node/npm remain unavailable; the browser runner executes the same shared suite as the optional Node adapter.
- Risks: the dictionary is finite, compounds require explicit ingredient knowledge, and generic “gram”, “dal” or “flour” are not inferred. Packaged-food composition and cross-contact are not validated. Exact dish IDs/names still exclude dishes rather than automatically excluding ingredient families; the legacy `matki` dish ID names a chickpea recipe, not a generic moth-bean ingredient.
- Other QA findings, including stale-tab overwrites and focus/draft handling, are outside this change and remain unresolved. Real-device and screen-reader verification is still pending.

## Remaining P0 items — Groceries, replacement, mobile and recovery

### Implemented

- Replaced the automatic seasoning bundle with explicit ingredients for all 46 dishes. Fixed kilogram/litre display precision; 1005 g now displays as 1.005 kg.
- Verified that a swap changes one slot, updates groceries and saved state, and resets shopping ticks. If no alternative exists, the existing meal and ticks remain with clear feedback.
- Added readable mobile navigation labels, 44-pixel swap/close controls, wrapping meal cards and grocery rows, and scrollable dialogs.
- Added accurate incomplete-plan counts, specific no-match explanations, disabled empty downloads, download-error feedback and recoverable runtime-error messages.
- Added `src/state.js` for saved-data validation and recovery. Invalid menus retain valid restrictions but clear stale ticks; unreadable preferences require confirmation. Storage failures show warnings and a retry option. Catalogue-version changes invalidate shopping ticks once.
- Scope remained P0. No P1/P2 features or dependencies were added.

### Automated results

- **44/44 shared logic checks passed in Safari** at `/tests/`, including all previous dietary regression checks and 15 new quantity, replacement, empty-state and storage checks.
- **16/16 browser checks passed in Safari** at `/tests/browser.html`. These exercise the real application in an iframe with isolated in-memory storage, leaving the user's saved household unchanged.
- Browser coverage: scaled recipe details; swap isolation and grocery refresh; persisted swap/reload; no-alternative preservation; empty/partial plans; invalid forms; corrupt saved data; invalid-menu recovery; blocked storage and quota failures; save retry; generated download content and failed download; runtime-error feedback.
- Layout checks cover plan, preferences, groceries and recipe dialogs at **320, 375, 390, 768 and 1200 pixels**, asserting no horizontal overflow/clipped controls, readable navigation labels and mobile swap target size.
- A first browser run exposed a test-frame load timing issue. Frame initialization was corrected; the final complete run passed all 16 checks.
- Node/npm are not installed, so `npm test` was not run. The shared suite ran through its browser runner instead.

### How to repeat

Start the server using the command in README. Open `/tests/` for logic checks. Open `/tests/browser.html` and click **Run browser checks** for interactions. Keep the test tab active until the final count appears. If Safari retains older modules, reload with Command+Option+R.

For a manual walkthrough: swap a dish and inspect groceries; set a 15-minute limit and inspect empty lunch/dinner slots; refresh and confirm the week remains saved; narrow the browser and try all three screens.

### Limits of verification

Viewport checks are simulated sizes in desktop Safari, not physical Android/iPhone testing. Screen-reader and broader cross-browser verification remain. Storage failures are injected; download checks capture file content and simulate API failure without testing the operating system's file-save flow. Recipe quantities remain approximate adult servings and need home-cook review. These results do not imply production readiness or comprehensive allergy safety.

## P0 item 1 — Dietary restriction matching

- Scope: ingredient/allergen exclusion resolution, the necessary clarification messages, and regression tests only. No recipe quantities, grocery algorithms, replacement strategy, mobile layout, or unrelated error-handling changes.
- Replaced substring matching with recognised ingredient identities, common plurals, aliases, allergen labels, and exact dish names.
- Unknown exclusions block saving new preferences; saved unresolved exclusions pause suggestions until clarified. Food-label and catalogue-completeness limitations still apply.
- Added 12 regression checks. Before the fix, seven of the first eight new checks failed; after implementation, all 29 checks pass in the JavaScript runtime and in Safari at `/tests/`.
- Checks cover peanut/groundnut false exclusions, onions/tomatoes/potatoes, case and separators, unknown restrictions, dairy/wheat/rice ingredient families, peas versus peanuts, generation and replacements with combined restrictions, every catalogue ingredient ID, and exact dish dislikes.
- Manually verified in Safari that an unknown exclusion displays a clarification message and does not save changes; refreshing retains the original saved plan.
- Node/npm are unavailable in this environment, so `npm test` was not run. The browser runner executed the shared automated suite instead.
- The saved-unknown banner path is supported by planner tests and code inspection; direct browser injection of malformed saved data was not tested. No broader mobile, download, or production-safety verification is claimed.

## Initial MVP verification

### Completed

- Local HTTP server responds with HTTP 200.
- 17/17 automated checks pass in Safari using `/tests/` (also independently executed in the available JavaScript runtime).
- Randomized tests cover 150 preference combinations.
- Verified a seven-day, 28-meal default vegetarian plan in Safari.
- Verified replacing Monday breakfast changes that dish and refreshes groceries.
- Verified grocery categories, quantities and checkbox progress.
- Verified saving two people with the Dairy filter produces a 28-meal plan without dairy dishes.
- Verified the same household and plan survive a page reload.
- Verified dish details show scaled ingredients, cooking notes and allergens.
- Visually inspected the desktop layout in Safari.
- Fixed early rounding of fractional ingredients; quantities now scale before display formatting.

### Remaining manual checks before a public pilot

- Test on real Android and iPhone screens and with a screen reader.
- Confirm grocery text downloads in each target browser.
- Check storage-disabled and storage-quota conditions on target devices.
- Have an Indian home cook review recipe details, portions, times and allergens.

### Useful edge cases to try

- 15-minute cooking limit: unavailable meal slots explain that no dish matches.
- Uncheck every meal: form asks for at least one meal.
- One person versus four: grocery quantities scale proportionately.
- Dairy + Gluten + Peanuts exclusions: eligible dishes must avoid all three.
- Dislike “aloo” or “palak”: potato or spinach dishes are excluded.
- Swap with no other eligible dish: existing meal remains and a message explains why.

## Household editing and guided interface — 2026-09-28

Safari verification: **73/73 shared logic/storage checks** and **29/29 browser checks passed**. `git diff --check` passed. Four added browser regressions cover household scaling with unchanged meals and reload persistence; cancellation, unchanged saves and invalid sizes; three-step validation/draft preservation; and mobile day selection. Existing viewport checks now inspect all three steps and the household dialog at 320, 375, 390, 768 and 1200 pixels. The pantry test also verifies separate stock headings.

Manually reviewed the desktop setup and 390px household dialog, including keyboard Escape dismissal. No actual phone or screen-reader audit was performed. Node/npm are unavailable, so the shared suite was run through its browser runner. Live email sign-in remains untested and unconfigured; provider tests use a fake service. Existing pre-task sign-in and pantry changes remain uncommitted alongside these interface changes. Nothing was committed, pushed or deployed.

# GharKa — MVP Product Definition

This document describes the application currently implemented in this repository. Future opportunities are listed separately and are not delivered features. GharKa is a local, browser-based prototype; it has not been published as a production service.

## Problem Statement

Indian households repeatedly face “Aaj kya banaye?”—what should we cook today? Deciding meals means balancing familiar foods, household preferences, restrictions, available time, and the ingredients needed for shopping.

## Target Users

- Parents and household members who decide and cook everyday Indian meals.
- People organising food and groceries for a household of 1–12 members.
- Non-technical users who need straightforward choices and familiar food names.

The current interface is in English. Each household uses one shared preference profile and adult-sized portions; it does not represent individual family members' needs.

## User Pain Points

These are the problems the MVP aims to address, not findings from completed user research:

- Repeated effort deciding what to cook across four daily meal occasions.
- Falling back on the same dishes because alternatives are hard to think of.
- Finding suggestions that fit diet, dislikes, allergies, and cooking time.
- Combining ingredients across meals and estimating family quantities.
- Keeping track of items already purchased.

## Product Goal

Help a household turn its preferences into a practical seven-day Indian menu and one grouped grocery checklist, with an easy way to replace unwanted suggestions. The intended outcome is less planning effort; this benefit has not yet been measured with users.

## Current MVP

### MVP Scope

The application has three main screens: **Weekly meal plan**, **My preferences**, and **Grocery list**. It uses a rules-based selection process over 46 predefined dishes and 55 ingredient definitions. It does not generate recipes with AI.

Users can select:

- Vegetarian, Eggetarian, or Non-Vegetarian food.
- An integer household size from 1 to 12.
- Any non-empty combination of Breakfast, Lunch, Snacks, and Dinner.
- North Indian, South Indian, Maharashtrian, Gujarati, and Bengali cuisines. Everyday Indian dishes remain eligible; selecting no regions allows all cuisines.
- Free-text dislikes and other ingredient exclusions, plus ten allergen checkboxes: Dairy, Gluten, Peanuts, Tree nuts, Eggs, Soy, Sesame, Mustard, Fish, and Shellfish.
- A maximum of 15, 30, 45, or 60 minutes per meal.

The app creates a Monday–Sunday plan, supports individual dish replacement and whole-week regeneration, displays dish ingredients and brief cooking notes, and derives a grouped grocery list. Users can check off groceries, clear checkmarks, and download a text list.

Preferences, the current plan, and grocery checkmarks are saved in this browser when storage is available. Responsive layouts are checked at five browser viewport widths; real-device usability and accessibility verification remain incomplete. Save failures show a retry option, incomplete plans show accurate counts, and empty grocery lists disable downloading.

**Defaults:** Vegetarian, four people, all four slots, all cuisines, no exclusions, and up to 45 minutes per meal. A first-time visitor sees an automatically generated default week.

### Out of Scope

The current MVP does not include:

- Accounts, cloud backups, household sharing, cross-device sync, or multiple saved weeks.
- AI-generated recipes, learning from swaps, or personalised nutrition advice.
- Calories, nutritional balancing, medical diet plans, budgets, or grocery prices.
- Pantry subtraction, leftovers, seasonal availability, or retailer ordering.
- Separate child portions or different restrictions for individual family members.
- Recipe editing by users, custom dish selection, or a recipe administration screen.
- Hindi/regional-language interfaces, calendar integration, reminders, or native mobile apps.
- Payments, delivery, or a publicly deployed service.

### Primary User Journey

1. Open the app and see the saved week, or the default week on first use.
2. Open **My preferences**, select household choices, and choose **Save & create my week**. This replaces the current week and clears grocery checkmarks.
3. Review the selected meal slots across seven days. Click a dish to see ingredients scaled for the household and cooking notes.
4. Use **↻** to replace one dish. Other meal positions remain unchanged; grocery quantities update and all shopping checkmarks reset.
5. Open **Grocery list**, review grouped quantities, check items already purchased, and optionally download the text file.
6. Return using the same browser and address. Valid saved preferences, meals, and checkmarks are restored; the screen starts on the weekly plan.

If no dish qualifies, the slot shows **No matching dish**. Unrecognised exclusions block saving a new plan, with a message identifying the terms to clarify; the existing saved preferences remain unchanged. If no replacement exists, the current dish remains and a message explains that no alternative is available.

### Functional Requirements

The following behaviours are implemented, subject to the known limitations below.

| ID | Requirement | Responsible code |
|---|---|---|
| FR-01 | Collect preferences; require at least one slot and a valid household size. | `app.js`: `preferencesView()`, `bind()`; `planner.js`: `validPreferences()` |
| FR-02 | Generate seven days for selected slots, with empty states when necessary. | `planner.js`: `eligible()`, `generatePlan()`; `app.js`: `planView()` |
| FR-03 | Replace one dish under the same filters, or retain it if no alternative exists. | `planner.js`: `replacement()`; `app.js`: `bind()` |
| FR-04 | Display recipe notes, ingredient quantities, and tracked allergens. | `app.js`: `openDish()` |
| FR-05 | Combine weekly ingredients, scale by household size, and group by grocery category. | `planner.js`: `groceryList()`, `formatAmount()`; `app.js`: `groceryView()` |
| FR-06 | Support shopping checkmarks, clearing them, and text download. | `app.js`: `bind()` |
| FR-07 | Save and restore household preferences, one plan, and shopping progress locally. | `app.js`: `save()`; `state.js`: `loadState()`, `restoreState()`, `saveState()` |
| FR-08 | Generate another week from current preferences without requiring an account. | `app.js`: `bind()` |

### Business Rules

- Indian meals and household habits remain the product focus.
- Dietary restrictions and allergies are hard constraints. Generation and replacement must not silently relax them. Current enforcement relies on catalogue tags and recognised ingredient identities; it is not a guarantee about packaged foods or cooking conditions.
- Vegetarian allows vegetarian dishes; Eggetarian also allows eggs; Non-Vegetarian allows all three classifications. Allowing eggs or meat does not guarantee their inclusion.
- Cooking-time and cuisine filters apply alongside exclusions. Everyday Indian dishes are included across regional selections.
- Generation prefers the least-used eligible dishes within the current week, choosing randomly among ties. Replacement prefers unused eligible alternatives. Repetition is allowed when variety is limited.
- All four slots create 28 positions; fewer selected slots create fewer positions. Empty positions are valid when restrictions leave no eligible dish.
- Grocery quantities equal per-adult recipe amounts multiplied by household size, summed across the plan. Household size does not directly influence dish selection or cooking times.
- Saving preferences, generating a week, or successfully replacing a dish resets grocery checkmarks. Saving preferences regenerates the week even if only household size changed.
- Existing working functionality must be preserved when adding features. Prefer simple solutions and explain major architecture changes before implementation.

### Success Metrics

There is no analytics instrumentation or recorded user-study baseline. The measures below distinguish technical acceptance from proposed product validation; they are not claims of achieved user outcomes.

| Measure | How to assess it | Current evidence or gap |
|---|---|---|
| Constraint correctness | Check generated and replacement dishes against selected restrictions; accept explicit empty slots. | Regression tests cover recognised names, plurals, aliases, and unknown exclusions; catalogue limitations remain. |
| Plan and grocery correctness | Verify seven days, selected slots, replacement isolation, aggregation, and proportional household scaling. | Existing automated checks and recorded desktop checks provide partial evidence. |
| Persistence | Refresh and confirm preferences, meal IDs, and checkmarks remain. | Restoration and simulated blocked/quota storage failures pass browser checks. |
| Independent task completion | Observe target users creating a week, swapping a dish, and using groceries without assistance. | Proposed usability measure; not yet measured. |
| Planning effort and usefulness | Time the task and ask users whether the menu reduces their usual decision effort. Record rejected suggestions and reasons. | Proposed pilot measure; no baseline or target agreed. |
| Continued use | Ask pilot households whether they use the planner again the following week. | Proposed follow-up measure; no retention data collected. |

[TESTING.md](TESTING.md) records 52 passing logic checks and 17 browser checks, including generation across 150 preference configurations, and the manual checks completed. Passing these checks does not establish production readiness, nutritional balance, or comprehensive allergy safety.

### Known Limitations

- **Catalogue quality:** Recipes, portions, and times need review by experienced Indian home cooks. Cooking notes are brief; times assume prepared batter or soaked/cooked pulses where mentioned.
- **Recipe estimates:** Each dish now lists its own seasonings. Arithmetic is tested against explicit fixtures, but ingredient amounts still need home-cook review.
- **Exclusion vocabulary:** Recognised names, common plurals, and aliases resolve to ingredient IDs or allergen tags. Explicit chickpea/chana/besan mappings now exclude both whole chickpeas and besan, including supported flour names. Named pulse and semolina aliases are supported; ambiguous terms such as “dal” still require clarification. Unknown exclusions require clarification, including ingredients absent from the catalogue. The previous groundnut/non-peanut-oil and plural-matching defects are fixed; this is not unrestricted natural-language interpretation.
- **Incomplete safety knowledge:** The app cannot identify unknown ingredients, product substitutions, or cross-contact. Diet classification recognises only specific ingredient keys and must be extended carefully with new foods.
- **Limited planning intelligence:** No nutritional, cost, or preparation optimisation. Lunch and dinner share a catalogue; there is no previous-week memory, actual date scheduling, or guaranteed egg/meat frequency. With the current catalogue, a 15-minute limit leaves lunch and dinner empty.
- **Local persistence only:** One household and week per browser origin. Clearing site data loses it. Invalid menus are rebuilt under valid saved restrictions and stale checkmarks are cleared. Unreadable preferences require confirmation before planning. Catalogue-version changes clear shopping ticks; there is no general historical-data migration system.
- **Serving assumptions:** Quantities use adult servings and do not account for children, appetite, pantry stock, package sizes, or increased batch cooking time.
- **Verification gaps:** Real-phone, screen-reader and cross-browser file-save verification remain. Automated browser checks cover swaps, groceries, refresh, empty/error states and five viewport widths. Storage/download failures are simulated. Repetition preference is not directly asserted; some older filter checks can pass on an empty result.

## Future Roadmap — Not Implemented

### Future Opportunities

These are candidates for prioritisation after product-owner review and user research, not committed releases or existing features.

1. **Make the existing MVP reliable:** Review recipe-specific ingredients and extend recognised exclusion vocabulary as needed; review portions, preparation times, and allergens; strengthen regression, storage, accessibility, and device testing.
2. **Validate with target households:** Observe parents and non-technical users, measure the proposed success metrics, and refine wording and flows from evidence.
3. **Improve Indian household fit:** Consider a broader reviewed catalogue, Hindi/regional languages, child portions, and clearer advance-preparation guidance.
4. **Improve planning and shopping:** Consider pantry tracking, leftovers, seasonal choices, budgets, and reviewed nutrition information if users need them.
5. **Support shared ongoing use:** Consider accounts, multiple weeks, cloud storage, and household sharing when cross-device use becomes a validated requirement.

A public pilot would also need hosting and a reliable release process. React, a backend, or a database should be introduced only for demonstrated needs; they are not automatically required to publish a static app. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current technical design and change criteria.

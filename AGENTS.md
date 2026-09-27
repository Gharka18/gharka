# Repository Guidelines

## Product Goal & Target Users

GharKa helps Indian households answer “What should I cook/eat today?” with seven-day meal plans and grouped grocery lists. Design for parents, non-technical users, and a beginner project owner. Keep setup, navigation, labels, and explanations simple.

## Current Stack & Structure

Static HTML, CSS, native JavaScript ES modules, and browser localStorage. No backend, build step, or required packages. Python serves local development; Node’s built-in test runner is optional.

- `src/app.js`: UI, events, downloads; `src/state.js`: persistence and recovery.
- `src/planner.js`: pure planning and grocery calculations.
- `src/data.js`: Indian dishes, ingredients, units, allergens.
- `src/styles.css`, `src/boot.js`, `index.html`: presentation and startup.
- `tests/`: shared checks and browser/Node runners; `docs/`: scope and verification.

## Business Rules

- Keep Indian meals and household habits central.
- Dietary restrictions and allergies are hard constraints: never violate or silently relax them, including during replacements. Show an explicit unavailable-meal state when no dish qualifies.
- Avoid unnecessary repetition; prefer unused eligible dishes. Limited variety never justifies violating restrictions.
- Scale groceries by household size. Store quantities per adult serving, aggregate consistently, and preserve precision before display rounding.
- Preserve working preferences, plans, swaps, grocery lists, and saved state when adding features.

## Coding Principles

Prefer simple, readable solutions over over-engineering. Avoid unnecessary dependencies; use native browser capabilities and existing modules first. Justify any new dependency.

Keep planning logic separate from DOM operations. Escape user-controlled HTML, validate saved data, and retain accessible labels and responsive layouts. Use explicit `.js` imports, camelCase identifiers, kebab-case dish IDs, two-space indentation for new multiline code, single quotes, and semicolons. Avoid unrelated reformatting.

## Development & Testing

- Run `python3 -m http.server 5173 --bind 127.0.0.1`; open `http://127.0.0.1:5173`.
- Run `npm test` when Node/npm are available, or open `/tests/` on the local server.

All existing checks must pass. Add behavioral regression checks in `tests/suite.js` for changed planning rules, exclusions, repetition, swaps, and quantity scaling. For UI changes, check core flows, refresh persistence, accessibility, and narrow screens. Report untested areas honestly in `docs/TESTING.md`.

## Rules for Changes

Keep changes focused and preserve existing functionality. Before major architecture changes, explain the reason, alternatives, tradeoffs, and migration impact in plain English. Do not introduce frameworks, services, or abstractions without a concrete need.

After major steps, explain what changed and how the beginner owner can test it. Update relevant documentation. Use descriptive commit subjects; PRs should describe behavior, verification, and screenshots for visual changes.

# Product & Engineering Decisions

## Decision 001 — Vanilla JavaScript instead of React

Decision:
Use HTML, CSS and JavaScript for MVP.

Reason:
The application is small enough that a framework would add
complexity without solving an immediate problem.

Trade-off:
As the application grows, component/state management may
become harder.

Future:
Consider React when UI complexity justifies it.

## Decision 002 — Curated meal database

Decision:
Use curated Indian meal data for MVP.

Reason:
Predictable recommendations and easy dietary validation.

Trade-off:
Limited meal variety.

Future:
Database/API/AI-assisted expansion.

## Decision 003 — LocalStorage

Decision:
Store preferences and plans locally.

Reason:
Avoid authentication/backend complexity in MVP.

Trade-off:
Data isn't synchronized between devices.

Future:
Move user profiles to backend storage.

## Decision 004 — Confirm preferences before first planning

New visitors must confirm household restrictions before any meal plan is created. Ingredients at home are optional and influence only otherwise equally varied suggestions. Unknown stock amounts do not reduce grocery totals. Existing saved households remain usable.

## Decision 005 — Optional hosted email authentication

Use Supabase email links with a guest option, retaining vanilla JavaScript. Load its pinned maintained SDK only when configured, rather than inventing password/session handling. Public connection settings are pending owner setup. Plans stay in separate local guest/account records; cross-device storage is future work. Live email/SMTP/callback verification is required before advertising sign-in as available.

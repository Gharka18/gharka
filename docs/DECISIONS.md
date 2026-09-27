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

# AGENTS.md
- Demo data lives client-side in `src/lib/bmc-store.tsx`, persisted to localStorage; no backend calls — the app is a front-end demo with simulated results.
- Pure types, constants and business rules (dates, validation, phone format, ad launch) live in `src/lib/bmc-model.ts` with tests in `bmc-model.test.ts` so rules stay testable without React.
- Seed/demo content lives in `src/lib/bmc-seed.ts`, separate from store logic.

# Lawdemy: working rules for Claude Code

## Where the designs are
- `design/README.md` is the index of every screen, plus the design tokens. Read it first.
- `design/learner/` and `design/instructor/` hold one `.dc.html` file per screen.
- `docs/PRD.md` is the product requirements document (text export of `Lawdemy PRD v1.pdf`).
- `docs/BUILD-NOTES.md` lists what's built, every design/PRD difference, and stubbed integrations. Update it when you finish a module.

## How to use them without overloading context
- Never read the whole `design/` folder at once. Read `design/README.md`, then open only the 1–3 screen files for the current task.
- Large files: read the markup inside `<x-dc>` for layout, then the `renderVals()` script for states, validation and copy.
- Read only the PRD section for the module you are building (search for its ID, e.g. `INS-CRS`).
- Build one module at a time. When a module is done and committed, start a fresh session (`/clear`) before the next.

## Build rules
- Rebuild the screens as real components in this project's stack. Do not copy the `.dc.html` runtime syntax.
- Match layout, copy, states (empty, loading, error, success, modals, toasts) and the tokens in `design/README.md`.
- Create shared components first: sidebar shell, buttons, inputs, slide-over panel, confirm dialog, toast, status badge, table with search/sort/filter, upload with progress, password strength meter, PIN input.
- Business rules come from PRD section 7 and are enforced on the server.
- Where design and PRD disagree, follow the PRD and add the difference to `docs/BUILD-NOTES.md`.

## Stack and commands
- Next.js 15 App Router, React 19, TypeScript, Tailwind 4 (tokens in `src/app/globals.css`), Prisma 6 + PostgreSQL, zod.
- `npm run db:local` starts a real local PostgreSQL 17 (embedded-postgres, UTF-8, data in `.pgdata`); stop it with Ctrl+C.
- `npm run db:migrate` (`prisma migrate dev`) creates/applies migrations; `npm run db:deploy` applies them in CI/production; `npm run db:seed` resets the demo catalogue.
- `npm run db:seed -- --fresh` also resets James’s own courses, withdrawals and bonuses.
- Seeded accounts (password `Lawdemy#2026`): instructor `james@lawdemy.test` (transaction PIN `2580`), learners `daniel@lawdemy.test` (new) and `adaeze@lawdemy.test` (existing), staff `admin@lawdemy.test` at `/admin` (TOTP 2FA, dev secret `JBSWY3DPEHPK3PXP`; add it to any authenticator app).
- A local production build (`npm run build && npm start`) needs `BANK_ENC_KEY` set; the mock checkout only runs in dev.
- `npm run dev`, `npm test` (vitest), `npm run typecheck`, `npm run build`.
- On Windows, stop the dev server before `prisma generate` (it locks the engine DLL).

## Code layout
- `src/components/ui`: shared components (Button, Field, SlideOver, Dialog/ConfirmDialog, Toast, StatusBadge, Stepper, Tabs, DataTable, EmptyState, Upload, PasswordStrength, PinInput, BankAccountForm, Onboarding: StepBars/MultiSelect/PasswordInput/SuccessBadge). Reuse them; don't restyle per screen.
- `src/components/layout`: `AuthLayout`, `InstructorShell`, `InstructorTopbar`. `src/components/learner`: `LearnerShell`, `Topbar`, `CourseCard`, `SortFilter`. `src/components/shared`: notifications bell, report dialog, attachments, discussion widgets.
- `src/features/<module>`: screen components. `src/app/(learner-auth)`, `src/app/(learner)`, `src/app/instructor`, `src/app/admin` (sign-in, 2FA; console pages under `(console)`, guarded by `requireStaffPage`): routes; `src/app/api`: route handlers (`api/admin/*` use `requireStaff`).
- `src/lib`: server logic. Rules shared by UI and server: `course/rules.ts`, `course/status-rules.ts`, `auth/password-rules.ts`, `quiz.ts`, `withdrawals.ts`, with tests next to them. Money: `wallet.ts` (ledger + balances), `withdrawals.ts`, `banking.ts`, `pin.ts`, `payments/` (provider interface + mock). Business values the PRD leaves open: `config.ts`. Staff operations: `admin/ops.ts`, `reconcile.ts`; quiz marking: `grading.ts`; staff-managed lists: `taxonomy-store.ts` (server) and `useTaxonomy()` from `components/TaxonomyProvider` (client).
- New multi-file work is easiest as a bundle: write files with Write, not shell heredocs (curly quotes break bash on this machine).

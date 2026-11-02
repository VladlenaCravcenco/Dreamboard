# Dreamboard MVP

Active flow: dreams → detail (photo, tasks, optional budget, notes) → explicit completion → memories. Account and simple statistics remain available. Interface copy in the active flow is Russian.

Deferred: Dreamcard/payment simulation, reminders, sharing, inspiration feed, floating music player, quote editing, and bulk deletion. Their components remain in source; prior detail, create, profile and memory dialogs are retained as `Deferred*` files. `/card` and `/reminders` redirect to the board while their feature flags are off.

Savings are manually recorded amounts, not payments. Completion has no financial, checklist, note or photo requirement. The cover is used when no completion photo is supplied.

Pending dream writes are stored per account and sent in order, keeping newer edits made during an in-flight request. Retry runs on reconnect, initial load, or the visible retry action. A server refresh cannot overwrite a newer local edit made during that request. This is not a multi-device conflict-resolution system: simultaneous edits on different devices still use the latest server write.

## Validation

- `npm test`: totals, optional budgets, excess savings, failed-write persistence, concurrent edits, account isolation, storage error reporting.
- `npm run build`: production bundle.
- `node tests/build-preview.mjs`: builds the actual UI with an isolated local backend in `/tmp/dreamboard-qa`. Run Vite with that directory as root for browser QA. The adapter is never imported by the production app.
- Browser QA: create a title-only dream; complete it with no tasks or budget; reload memories; verify 100% completion. Add a task to another dream, check it, set a $100 budget and $150 saved; reload and verify the task, amount, 100% progress and $0 remaining.

## Live verification still needed

Supabase email delivery, authentication, account deletion and cross-device synchronization require a test account against the deployed backend. Password recovery now has a dedicated `/reset-password` screen; add the local and deployed `/reset-password` URLs to the Supabase Auth redirect allowlist. Existing database migrations must be applied for dreams and ownership policies.

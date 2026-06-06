# Phase 2 — Confirm-to-Connect

Status: **data model + API done; UI pending.**

## What changed and why

A scanned submission used to become a network connection instantly. Phase 2 makes
it a *request* the profile owner approves first.

`Connection.status` (string, `@default("pending")`):

| value       | meaning                                                              |
|-------------|---------------------------------------------------------------------|
| `pending`   | scanner submitted; awaiting the owner's decision (initial state)    |
| `confirmed` | owner accepted; counts toward their network                         |
| `declined`  | owner rejected; hidden from the network but **kept**                |

### Decisions (agreed with the owner)
- **Owner approves each** request — not auto-confirm.
- **Declined rows are retained**, not deleted. The POST route's existing email-hash
  dedup returns early for any prior row from the same email, so a declined person who
  re-scans gets a silent `ok` and is **not** resurfaced as a fresh request (anti-spam).
- **Existing rows → `pending`.** See the migration note below.

## The migration-via-default trick

`prisma migrate diff --from-empty` only ever emits `CREATE TABLE`, so `scripts/turso-push.mjs`
synthesises `ALTER TABLE ADD COLUMN` for columns missing from already-existing prod
tables. SQLite can't `ADD COLUMN ... NOT NULL` without a default — but because `status`
ships with `@default("pending")`, the ALTER succeeds **and** every pre-existing row is
backfilled to `pending` for free. No separate data-migration script. (If a future column
is NOT NULL with no default, this breaks — give it a default or make it nullable.)

## API surface

- `POST /api/connections` — **unchanged.** New rows inherit the `pending` default.
- `PATCH /api/connections/[id]` — **new.** Owner action: body `{ status: "confirmed" | "declined" }`.
  - Auth via `requireAuth()`; `401` if not logged in.
  - `400` if status isn't a valid owner decision (`lib/connections.ts#isOwnerDecision`) —
    notably `"pending"` is rejected, so a request can't be reset back to the inbox.
  - Ownership is enforced **inside** the `updateMany` where-clause
    (`{ id, profile: { userId } }`): a non-owned id matches zero rows → `404`. No separate
    fetch-then-check, so there's no TOCTOU gap.

## Tests (Vitest)

- `tests/connections.test.ts` — `isOwnerDecision` accepts confirmed/declined, rejects
  pending / unknown / non-strings.
- `tests/api-connection-patch.test.ts` — PATCH handler with mocked auth + prisma:
  401 unauth, 400 bad status, 200 + correct where/data on an owned row, 404 when the
  relation filter matches nothing.

Run with `npm test`.

## Still to do (UI — paused for review)

1. Connections page: a "Requests" inbox (pending) with Confirm/Decline calling the PATCH
   route; confirmed rows in the existing categorized view; declined hidden.
2. Dashboard counts: "X connected" = confirmed only, plus an "N pending" badge.
3. my-connections + notifications: split confirmed/pending; relabel pending as a request.
4. ConnectForm success copy: "Request sent — {name} will confirm" (not "You're connected").

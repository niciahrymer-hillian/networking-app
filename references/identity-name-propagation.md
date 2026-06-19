# Identity rule: username vs. full name, and how a name change propagates

One person has **two** distinct identity fields. They are edited and propagate
differently — keep them straight.

| Field | Stored in | Drives | On change |
|---|---|---|---|
| **Username** (`@handle`) | `User.username` | Account + feed identity, `/u/<username>` URL, @mentions | Normalized to `^[a-z0-9_]{3,30}$` (lowercased). Account-level only. |
| **Full name** | `User.name` | The person's display name on **profile cards, business card, and QR landing** (`/p/<slug>`) | **Propagates to every card they own** — see below. |

## The propagation rule

When a user updates their **full name** ([PATCH /api/account](../app/api/account/route.ts)):

1. `User.name` is updated (trimmed, max 80 chars).
2. The same name is written to **`Profile.name` on every card the user owns**
   (`prisma.profile.updateMany({ where: { userId } })`).

Because the public card (`/p/<slug>`), the downloadable vCard
([vcard route](../app/p/[slug]/vcard/route.ts)), and the QR landing page all
render `Profile.name`, the new name shows up on the **business card and QR code**
immediately. The QR image itself never has to change — it encodes the stable
`/p/<slug>` URL, and that page now shows the new name.

**Connections see it live, no propagation needed:** the feed and comments read
`author.name` (= `User.name`) at query time, falling back to the owner card's
name ([comments route](../app/api/posts/[id]/comments/route.ts)). So any connected
account viewing a post sees the updated name on the next load.

## Why these choices

- **Clearing the name does not blank the cards.** `Profile.name` is required
  (non-null in the schema), so an empty account name is a no-op for cards — it
  only nulls `User.name`.
- **All owned cards, not just the owner card.** The request was that the full
  name flow to "their profile cards, business card and QR code." If you ever want
  per-card names again (e.g. a separate stage name on a secondary career card),
  scope the `updateMany` to `{ userId, isOwner: true }` and let secondary cards
  diverge.

## Tests
[tests/api-account-patch.test.ts](../tests/api-account-patch.test.ts) covers:
name propagates to all owned cards, clearing the name does not touch cards,
avatar-only edits don't touch cards, and unauthenticated calls write nothing.

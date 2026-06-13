# 🤝 Networking Cards — Walkthrough

> A digital business card you share with a QR code. Someone scans it, lands on your card, and can save your contact or create an account to follow each other's posts — turning a one-time handshake into an ongoing connection.

> **Screenshots:** images live in [`docs/screenshots/`](screenshots/). Filenames below assume a capture per section — update the paths to match your own captures if they differ.

---

## The user story

> *"I'm at an event. Someone scans the QR on my phone. They see my card, tap **Save contact**, and — because they liked what I do — create an account so we stay connected. Now their posts show up in my feed, and mine in theirs. The handshake didn't end at the door."*

This is the path a new connection travels, end to end.

---

## 1. The card — `/p/[slug]` *(public)*

The page a scan lands on: a warm `👋 Hello!` intro, the person's live card (tap to flip → QR), a one-tap **Save contact**, and an inline *Let's connect* panel.

Cards are fully themeable — pick a **template** (layout), a **palette**, and a **font** in the editor:

| Template | Look |
|----------|------|
| `classic` | Cover band, centered photo |
| `minimal` | Clean, left-aligned, no band |
| `bold` | Big color header |
| `split` | Color panel beside details |
| `spotlight` | Tall hero cover, large overlapping photo |
| `sidebar` | Full-height accent rail, compact header |

The generated flip **business card** picks a matching front style automatically — `banded`, `filled`, or `outline` — so it stays consistent with the chosen template.

![Public card page](screenshots/01-card.png)

## 2. The connect flow — `/p/[slug]/connect` *(public)*

Three ways to respond, no friction: **Create account** (follow each other's posts), **Sign in** (already a member), or **Just contact** (leave details, no account).

![Connect flow](screenshots/02-connect.png)

## 3. The dashboard — `/dashboard` *(authenticated)*

Home base after signing in — a drag-and-drop grid of tiles you can reorder (order persists per user). It includes:

- **Recent activity** — scans, new connections, *plus notifications* for new posts from your network and people who joined it.
- **Pending requests** — incoming connection requests with **Confirm / Decline** inline.
- **People you may know** — friends-of-friends, ranked by mutual connections, each with a **Connect** button.
- **Profile strength** — a completeness meter nudging you to finish your profile.
- **Your cards** — manage, edit, share QR, and track scans per card.

![Dashboard](screenshots/03-dashboard.png)

## 4. Activity — `/notifications` *(authenticated)*

A **stats overview** strip (scans, connections, pending, network size) above a running log of every connection and scan across your cards.

![Activity](screenshots/04-activity.png)

## 5. The feed — `/feed` *(authenticated)*

Posts from your network — markdown, images, YouTube/link embeds, and `#hashtags`. A connection is a relationship, not just a saved phone number.

![Feed](screenshots/05-feed.png)

## 6. The member profile — `/u/[username]` *(authenticated)*

Your public-facing presence inside the network: your card alongside everything you've posted.

![Member profile](screenshots/06-profile.png)

---

## Try it locally

```bash
npm run dev

# Seed demo data — five connections (Ava, Liam, Sofia, Maya, Noah), each on a
# different card template, with posts, events, pending requests, and a network.
# Reads TARGET_EMAILS + SEED_PASSWORD from .env (gitignored); ENCRYPTION_KEY from .env.local.
node scripts/seed-demo.mjs

# Then visit:
#   http://localhost:3000/p/demo-ava   (spotlight template)
#   http://localhost:3000/p/demo-noah  (sidebar template)
#   http://localhost:3000/dashboard    (log in as ava@example.com)
```

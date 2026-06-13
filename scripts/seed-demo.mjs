// Demo seed for testing the feed + dashboard tiles. For each TARGET account it
// attaches: 5 shared demo connections (each with their own card + posts), mutual
// network links, the target's own posts, and scan/connection activity on their
// card. The real targets are ALSO connected to each other, so they see each
// other's posts in their feeds.
//
// Idempotent: all rows use "demo*" id prefixes and are deleted before re-insert,
// so you can run it repeatedly without piling up duplicates.
//
//   node scripts/seed-demo.mjs
//
// Reads TARGET_EMAILS and SEED_PASSWORD from .env (gitignored) via dotenv.
// You can still override inline, e.g.:
//   TARGET_EMAILS="a@x.com,b@y.com" node scripts/seed-demo.mjs
//
// Uses @libsql/client directly (raw SQL) against the same DB the app uses.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Next.js local secrets: ENCRYPTION_KEY, TURSO_*
dotenv.config();                        // .env: TARGET_EMAILS, SEED_PASSWORD
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { createCipheriv, randomBytes, createHash } from "crypto";

const TARGET_EMAILS = (process.env.TARGET_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
if (TARGET_EMAILS.length === 0) {
  console.error("❌ TARGET_EMAILS is not set. Add it to .env (comma-separated real account emails). See the header of this file.");
  process.exit(1);
}

const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  console.error("❌ SEED_PASSWORD is not set. Add it to .env. See the header of this file.");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Prisma stores SQLite DateTime as ISO-8601 text with a +00:00 offset.
const iso = (minsAgo = 0) =>
  new Date(Date.now() - minsAgo * 60_000).toISOString().replace("Z", "+00:00");
const pw = bcrypt.hashSync(SEED_PASSWORD, 10);

// Mirror lib/crypto.ts (AES-256-GCM) so seeded connection emails decrypt in-app.
// Falls back to null labels if no ENCRYPTION_KEY (then pending requests show "New request").
const ENC_HEX = process.env.ENCRYPTION_KEY;
const canEncrypt = ENC_HEX?.length === 64;
if (!canEncrypt) {
  console.warn("⚠️  ENCRYPTION_KEY (64 hex) not found in .env.local — pending requests will have no email labels.");
}
const encrypt = (text) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(ENC_HEX, "hex"), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
};
const sha256 = (text) => createHash("sha256").update(text.toLowerCase().trim()).digest("hex");

// Curated, stable Unsplash images (all verified 200). Each is used at most once
// across the whole seed so no two posts share a picture.
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const IMG = {
  designWorkspace: U("1497032628192-86f99bcd76bc"),
  conference:      U("1540575467063-178a50c2df87"),
  teamMeetup:      U("1528605248644-14dd04022da1"),
  analytics:       U("1551288049-bebda4e38f71"),
  startupOffice:   U("1559136555-9303baea8ebd"),
  whiteboard:      U("1517245386807-bb43f82c33c4"),
  code:            U("1555066931-4365d14bab8c"),
  charts:          U("1460925895917-afdab827c52f"),
  collab:          U("1522071820081-009f0129c71c"),
  speaker:         U("1475721027785-f74eccf877e2"),
  growthChart:     U("1543286386-713bdd548da4"),
  server:          U("1558494949-ef010cbdcc31"),
  coffeeMeeting:   U("1521737604893-d14cc237f11d"),
  celebration:     U("1531058020387-3be344556be6"),
  networking:      U("1556761175-4b46a572b786"),
  mobileDesign:    U("1512941937669-90a1b58e7e9c"),
  desk:            U("1486312338219-ce68d2c6f44d"),
  meeting:         U("1600880292203-757bb62b4baf"),
  womanLaptop:     U("1573164713988-8665fc963095"),
  teamLaptop:      U("1519389950473-47ba0277781c"),
  workshop2:       U("1519337265831-281ec6cc8514"),
  chartsBoard:     U("1454165804606-c3d57bc86b40"),
  coding:          U("1531482615713-2afd69097998"),
  developers:      U("1551434678-e076c223a692"),
  // Vacation / relaxation + social events (life outside work)
  beach:           U("1507525428034-b723cf961d3e"),
  mountainHike:    U("1476514525535-07fb3b4ae5f1"),
  roadTrip:        U("1469854523086-cc02fe5d8800"),
  lakeView:        U("1501785888041-af3ef285b470"),
  sunset:          U("1500534314209-a25ddb2bd429"),
  camping:         U("1533105079780-92b9be482077"),
  partyCelebration:U("1530103862676-de8c9debad1d"),
  dinnerTable:     U("1517457373958-b7bdd4587205"),
  teamDinner:      U("1552674605-db6ffd4facb5"),
  hiking:          U("1530023367847-a683933f4172"),
  cityTravel:      U("1523580494863-6f3031224c94"),
};

// label, username, slug, headline, headshot, share?, posts[]
// Post types are mixed on purpose: plain updates, image posts, event invites, and links.
const CONNECTIONS = [
  {
    username: "ava", name: "Ava Chen", slug: "demo-ava",
    headline: "Product Designer · seamless digital experiences",
    headshot: "https://i.pravatar.cc/240?img=47", palette: "violet", share: 1, template: "spotlight", cardTemplate: "monogram",
    email: "ava.chen@example.com", phone: "+1 (555) 247-8810", linkedin: "https://linkedin.com/in/avachen",
    posts: [
      { mins: 35, content: "Shipped our onboarding redesign this morning — early data shows a 30% drop in first-week churn. Proof that the boring details (empty states, error copy, loading skeletons) ARE the product. ✨", tags: ["design", "ux"] },
      { mins: 180, content: "Spent the day auditing our design system. 240 components, ~70% barely used. Sometimes the highest-leverage design work is deletion.", mediaUrl: IMG.designWorkspace, mediaType: "image", tags: ["designsystems"] },
      { mins: 420, content: "We're hiring a Senior Product Designer on my team — remote-friendly, systems thinker, genuinely enjoys talking to users. If that's you (or someone you rate), DM me. 🙌", tags: ["hiring", "design"] },
      { mins: 760, content: "Before & after of our mobile checkout: seven taps down to three. The redesign didn't add anything — it removed everything that wasn't the decision.", mediaUrl: IMG.mobileDesign, mediaType: "image", tags: ["ux", "mobile"] },
      { mins: 1150, content: "Hot take: “make it pop” is almost always feedback about contrast, hierarchy, or spacing. Name the real problem and the fix becomes obvious.", tags: ["design"] },
      { mins: 1600, content: "Required reading for everyone on my team — Nielsen Norman's 10 usability heuristics still hold up after 30 years.", linkUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/", tags: ["ux", "research"] },
      { mins: 2100, content: "Workshop day. Nothing aligns a team faster than a wall of sticky notes and one sharp question: “what are we actually trying to help the user do?”", mediaUrl: IMG.whiteboard, mediaType: "image", tags: ["designops"] },
      { mins: 2750, content: "📅 Speaking at DesignOps Summit on Thursday — “Scaling a design system without slowing teams down.” Scan my card for a front-row invite. 🎤", mediaUrl: IMG.conference, mediaType: "image", tags: ["event", "design"] },
      { mins: 3400, content: "Mentorship win: three of my mentees landed their first product design roles this quarter. Watching people level up is the best part of this job. 💚", tags: ["mentorship"] },
      { mins: 4200, content: "Designers — go sit with your engineers. We switched to cross-functional pairing and handoff time dropped by half. Specs don't build trust; proximity does.", mediaUrl: IMG.collab, mediaType: "image", tags: ["collaboration"] },
    ],
  },
  {
    username: "liam", name: "Liam Patel", slug: "demo-liam",
    headline: "Growth marketer · data-driven campaigns",
    headshot: "https://i.pravatar.cc/240?img=12", palette: "executive", share: 0, template: "bold", cardTemplate: "wordmark", font: "slab",
    email: "liam.patel@example.com", phone: "+1 (555) 310-4422", linkedin: "https://linkedin.com/in/liampatel",
    posts: [
      { mins: 90, content: "The best growth lever is still a product people genuinely love. Ads, SEO, lifecycle — those just amplify whatever's already there. Fix the product first.", tags: ["growth", "startups"] },
      { mins: 520, content: "Q3 recap: one rewritten onboarding email sequence lifted activation 41%. Compounding beats clever, every single time.", mediaUrl: IMG.growthChart, mediaType: "image", tags: ["growth", "retention"] },
      { mins: 980, content: "We're hiring a Lifecycle Marketing Manager — remote, experiment-obsessed, comfortable in a SQL editor. Know someone great? Tag them below. 👇", tags: ["hiring", "marketing"] },
      { mins: 1450, content: "Coffee chats > cold emails. Met three brilliant founders this week through a single QR scan at a meetup. 🤝", tags: ["networking"] },
      { mins: 2150, content: "📅 Hosting a free Growth Clinic this Friday, 3pm PT — bring your funnel, leave with three experiments to run Monday. Scan my card to join.", mediaUrl: IMG.speaker, mediaType: "image", tags: ["event", "growth"] },
      { mins: 3050, content: "Attribution truth nobody likes: customers don't remember which channel “converted” them. Stop optimizing for the last click and start earning the first impression.", tags: ["marketing"] },
    ],
  },
  {
    username: "sofia", name: "Sofia Gomez", slug: "demo-sofia",
    headline: "Data scientist · turning analytics into action",
    headshot: "https://i.pravatar.cc/240?img=32", palette: "marine", share: 1, template: "split", cardTemplate: "portrait", font: "humanist",
    email: "sofia.gomez@example.com", phone: "+1 (555) 882-1097", linkedin: "https://linkedin.com/in/sofiagomez", github: "https://github.com/sofiagomez",
    posts: [
      { mins: 220, content: "A dashboard nobody opens is just an expensive screenshot. Build for the decision someone has to make, not the metric you happen to be able to measure.", tags: ["data", "analytics"] },
      { mins: 650, content: "Shipped our churn model to production this week — it flags at-risk accounts two weeks earlier, precision 0.82. The saved-revenue dashboard goes live Monday.", mediaUrl: IMG.analytics, mediaType: "image", tags: ["ml", "data"] },
      { mins: 1180, content: "I'm hiring a Data Analyst — strong SQL and an instinct for turning numbers into a story. Junior-friendly; we mentor hard. DM me if you're curious. 📊", tags: ["hiring", "data"] },
      { mins: 1750, content: "A/B test wrapped: the simpler pricing page beat the feature-rich one by 12% (97% confidence). Kill your darlings — users want clarity, not completeness.", mediaUrl: IMG.charts, mediaType: "image", tags: ["experimentation"] },
      { mins: 2450, content: "The most underrated data skill is saying “we don't have enough signal yet” instead of forcing a conclusion so it sounds smart in the meeting.", tags: ["analytics"] },
      { mins: 3300, content: "Open-sourced our feature-store starter today — would genuinely love feedback from anyone running ML in production.", linkUrl: "https://github.com/feast-dev/feast", tags: ["opensource", "ml"] },
    ],
  },
  {
    username: "maya", name: "Maya Okafor", slug: "demo-maya",
    headline: "Founder · building in public",
    headshot: "https://i.pravatar.cc/240?img=5", palette: "forest", share: 0, template: "minimal", cardTemplate: "elegant", font: "elegant",
    email: "maya@okaforlabs.com", phone: "+1 (555) 720-6685", linkedin: "https://linkedin.com/in/mayaokafor",
    posts: [
      { mins: 300, content: "Day 142 of building in public. Revenue is up, sleep is down, conviction is steady. The only graph that matters is the one still climbing next quarter. 🚀", tags: ["buildinpublic"] },
      { mins: 820, content: "We moved into our first real office today. Two years ago this company was a Notion doc and a lot of nerve.", mediaUrl: IMG.startupOffice, mediaType: "image", tags: ["startups"] },
      { mins: 1350, content: "Our first three hires changed everything. Now hiring #4 — a founding engineer who wants real ownership, not a ticket queue. Equity, autonomy, hard problems. DM me.", tags: ["hiring", "founders"] },
      { mins: 1950, content: "📅 Founder dinner next Wednesday — small, candid, building-in-public crowd. No pitches, just honest war stories. Scan my card to grab one of the last seats.", mediaUrl: IMG.coffeeMeeting, mediaType: "image", tags: ["event", "founders"] },
      { mins: 2700, content: "🎉 We crossed 1,000 paying users this morning. Every one of them started with someone scanning a card and deciding to say yes. Thank you. 💚", mediaUrl: IMG.celebration, mediaType: "image", tags: ["milestone"] },
      { mins: 3600, content: "Fundraising lesson learned the hard way: investors fund momentum, not ideas. Show them the slope, not the snapshot.", tags: ["fundraising"] },
    ],
  },
  {
    username: "noah", name: "Noah Kim", slug: "demo-noah",
    headline: "Full-stack engineer · React + edge",
    headshot: "https://i.pravatar.cc/240?img=68", palette: "mocha", share: 0, template: "sidebar", cardTemplate: "corporate",
    email: "noah.kim@example.com", phone: "+1 (555) 559-3471", linkedin: "https://linkedin.com/in/noahkim", github: "https://github.com/noahkim",
    posts: [
      { mins: 45, content: "Hot take: most apps don't need a state-management library. useState + the URL gets you surprisingly far before you reach for the heavy machinery.", tags: ["react", "webdev"] },
      { mins: 560, content: "Open-sourced my edge-rendering starter and it hit 1.2k stars in a week. Wild what happens when you scratch your own itch in public.", mediaUrl: IMG.code, mediaType: "image", tags: ["opensource", "edge"] },
      { mins: 1020, content: "My team is hiring two Full-stack Engineers (React + edge). We value boring technology, good docs, and shipping on Fridays. Remote. DM me to chat. 👋", tags: ["hiring", "engineering"] },
      { mins: 1640, content: "Moved our rendering to the edge and cut p95 latency from 340ms to 90ms. Users didn't read the changelog — they just felt it get faster.", mediaUrl: IMG.server, mediaType: "image", tags: ["performance"] },
      { mins: 2350, content: "DX tip: a 30-second local setup is a feature. If onboarding a new dev takes a full day, that's not “just how it is” — it's a bug with a fix.", tags: ["webdev"] },
      { mins: 3150, content: "Wrote up how we ship on Fridays without fear: preview deploys, fast tests, small PRs. Calmest release process I've ever worked in.", linkUrl: "https://web.dev/articles/vitals", tags: ["engineering"] },
    ],
  },
  {
    username: "priya", name: "Priya Nair", slug: "demo-priya",
    headline: "Senior Product Manager · 0→1 products",
    headshot: "https://i.pravatar.cc/240?img=33", palette: "sky", share: 1, template: "classic", cardTemplate: "duo", font: "humanist",
    email: "priya.nair@example.com", phone: "+1 (555) 401-7723", linkedin: "https://linkedin.com/in/priyanair",
    posts: [
      { mins: 120, content: "Prioritization is saying no to good ideas so the great one ships. Our roadmap got 3x clearer the day we capped “in progress” at three.", tags: ["product", "pm"] },
      { mins: 640, content: "Shipped a feature we'd debated for months. Turns out 20 customer interviews beat 200 opinions — including mine.", mediaUrl: IMG.meeting, mediaType: "image", tags: ["product"] },
      { mins: 1300, content: "We're hiring an Associate Product Manager — curious, writes clearly, obsessed with the “why” behind every ask. Early-career welcome, we mentor. DM me. 📦", tags: ["hiring", "product"] },
      { mins: 2200, content: "Best PM habit I built this year: every spec opens with the user problem in one sentence. If I can't write it, it isn't ready to build.", mediaUrl: IMG.womanLaptop, mediaType: "image", tags: ["pm"] },
    ],
  },
  {
    username: "david", name: "David Brooks", slug: "demo-david",
    headline: "Partnerships & Business Development",
    headshot: "https://i.pravatar.cc/240?img=8", palette: "burgundy", share: 0, template: "bold", cardTemplate: "initials", font: "slab",
    email: "david.brooks@example.com", phone: "+1 (555) 668-2240", linkedin: "https://linkedin.com/in/davidbrooks",
    posts: [
      { mins: 200, content: "Closed a partnership today that started as a 5-minute hallway chat at a conference last spring. Relationships compound — show up, follow up, repeat.", tags: ["partnerships", "sales"] },
      { mins: 760, content: "On the road this week meeting partners face to face. No deck closes like a real conversation over coffee.", mediaUrl: IMG.teamLaptop, mediaType: "image", tags: ["bd"] },
      { mins: 1500, content: "Hiring an Account Executive — consultative, curious, allergic to “just checking in” emails. Strong base + uncapped. Tag someone sharp. 🤝", tags: ["hiring", "sales"] },
      { mins: 2600, content: "Reminder: “no” is rarely forever. Half my best deals were a “not right now” I nurtured for a year. Patience is a sales skill.", tags: ["sales"] },
    ],
  },
  {
    username: "elena", name: "Elena Petrova", slug: "demo-elena",
    headline: "UX Researcher · mixed methods",
    headshot: "https://i.pravatar.cc/240?img=16", palette: "blush", share: 1, template: "framed", cardTemplate: "framed", font: "elegant",
    email: "elena.petrova@example.com", phone: "+1 (555) 293-5510", linkedin: "https://linkedin.com/in/elenapetrova",
    posts: [
      { mins: 260, content: "Watched five users try our new flow today. Four got stuck in the exact same spot. That's not an anecdote — that's a roadmap item.", tags: ["ux", "research"] },
      { mins: 880, content: "Usability session in full swing. The magic isn't the script — it's the silence after “show me how you'd do that.”", mediaUrl: IMG.workshop2, mediaType: "image", tags: ["research"] },
      { mins: 1700, content: "We're hiring a UX Researcher — mixed methods, great at turning messy interviews into decisions teams actually make. DM me to chat. 🔍", tags: ["hiring", "ux"] },
      { mins: 2900, content: "Quant tells you what's happening; qual tells you why. Ship a survey with no interviews behind it and you'll optimize the wrong thing.", mediaUrl: IMG.chartsBoard, mediaType: "image", tags: ["research"] },
    ],
  },
  {
    username: "marcus", name: "Marcus Lee", slug: "demo-marcus",
    headline: "Developer Advocate · community & docs",
    headshot: "https://i.pravatar.cc/240?img=60", palette: "teal", share: 0, template: "sidebar", cardTemplate: "wave", font: "mono",
    email: "marcus.lee@example.com", phone: "+1 (555) 774-0098", linkedin: "https://linkedin.com/in/marcuslee", github: "https://github.com/marcuslee",
    posts: [
      { mins: 70, content: "Developer advocacy in one line: make the hard thing easy, then get out of the way. Docs are a product, not an afterthought.", tags: ["devrel", "community"] },
      { mins: 600, content: "Ran a live coding workshop tonight — 40 devs, one API, zero slides. Best feedback loop in the business.", mediaUrl: IMG.coding, mediaType: "image", tags: ["devrel"] },
      { mins: 1400, content: "We're hiring a Developer Advocate — loves teaching, ships demos, turns GitHub issues into better products. Remote, conference budget included. DM me. 👋", tags: ["hiring", "devrel"] },
      { mins: 2400, content: "Open-sourced the demo from tonight's workshop. Stars are nice; the PR from a first-time contributor made my week.", mediaUrl: IMG.developers, mediaType: "image", tags: ["opensource", "community"] },
    ],
  },
];

// Your own posts (so the feed shows you + your network).
const MY_POSTS = [
  { mins: 10, content: "Trying out the new feed — posts, photos, links, and #hashtags all in one place. This is what staying in touch after an event should feel like. 🎉", tags: ["networking"] },
  { mins: 480, content: "📅 Hosting a networking mixer this Thursday — scan my card at the door and we're connected before you've even shaken hands. See you there!", mediaUrl: IMG.networking, mediaType: "image", tags: ["event", "networking"] },
  { mins: 720, content: "Met some genuinely brilliant people at today's demo day. One QR scan each and my whole network just leveled up. This is the way.", mediaUrl: IMG.teamMeetup, mediaType: "image", tags: ["networking"] },
  { mins: 1080, content: "Cleared the desk, cleared my head — spending the afternoon following up with everyone I met this month. If we crossed paths, let's actually stay in touch. 👋", mediaUrl: IMG.desk, mediaType: "image", tags: ["networking"] },
];

// Extra posts per connection — project updates, social events, and vacation/relax
// scenes (life outside work). Appended to each connection's own posts at seed time.
const EXTRA = {
  ava: [
    { mins: 280, content: "Project update: design system v3 is live across all four products — one source of truth at last. The whole team moves faster now. 🎨", tags: ["designsystems", "update"] },
    { mins: 5200, content: "Logged off for a long weekend by the coast. My best design ideas always show up the moment I stop staring at a screen. 🌊", mediaUrl: IMG.beach, mediaType: "image", tags: ["timeoff"] },
  ],
  liam: [
    { mins: 520, content: "Team dinner after we cleared the quarterly number. The wins land differently when you celebrate them together. 🥂", mediaUrl: IMG.teamDinner, mediaType: "image", tags: ["team", "culture"] },
    { mins: 4600, content: "Trail miles > inbox miles this weekend. Turns out the best growth strategy is sometimes touching grass. 🥾", mediaUrl: IMG.hiking, mediaType: "image", tags: ["balance"] },
  ],
  sofia: [
    { mins: 760, content: "Project update: the recommendation engine we started in Q1 just crossed 1M predictions/day in prod. Quietly proud of this team. 📈", tags: ["data", "update"] },
    { mins: 5400, content: "Sunset, airplane mode, and a paperback. Recharging so the models can keep training without me hovering. 🌅", mediaUrl: IMG.sunset, mediaType: "image", tags: ["timeoff"] },
  ],
  maya: [
    { mins: 4800, content: "Founder brains need reboots too. Three days in the mountains — no laptop, no Slack — and I came back with the clearest roadmap I've had in a year. ⛰️", mediaUrl: IMG.mountainHike, mediaType: "image", tags: ["balance"] },
  ],
  noah: [
    { mins: 900, content: "Project update: migrated the last service off the legacy stack today — two years of incremental work, zero downtime. Boring deploys are beautiful.", tags: ["engineering", "update"] },
    { mins: 5000, content: "Closed the laptop, opened a tent. The best debugging tool is sometimes a campfire and no signal. 🔥", mediaUrl: IMG.camping, mediaType: "image", tags: ["balance"] },
  ],
  priya: [
    { mins: 5300, content: "Took the week off and went somewhere with no roadmap and no Wi-Fi. 10/10, would prioritize again. ✈️", mediaUrl: IMG.cityTravel, mediaType: "image", tags: ["balance"] },
  ],
  david: [
    { mins: 1150, content: "Closed out the conference with the whole crew at the afterparty. Deals get signed in the meeting; relationships get built right here. 🎉", mediaUrl: IMG.partyCelebration, mediaType: "image", tags: ["networking", "events"] },
    { mins: 4700, content: "A few days off the grid on the lake before Q3 kicks off. Even closers need an off-season. 🎣", mediaUrl: IMG.lakeView, mediaType: "image", tags: ["timeoff"] },
  ],
  elena: [
    { mins: 1250, content: "Hosted our first community dinner for researchers in the city — 18 strangers, one long table, zero awkward silences. 🍽️", mediaUrl: IMG.dinnerTable, mediaType: "image", tags: ["community", "events"] },
  ],
  marcus: [
    { mins: 5100, content: "Conference season's over — celebrating with a road trip and exactly zero talks to prep. 🚗", mediaUrl: IMG.roadTrip, mediaType: "image", tags: ["timeoff"] },
  ],
};

async function main() {
  // Resolve each target email -> { email, key, id, username, profileId }.
  const targets = [];
  for (const email of TARGET_EMAILS) {
    const u = await db.execute({ sql: "SELECT id, username FROM User WHERE email = ?", args: [email] });
    if (u.rows.length === 0) { console.warn(`⚠️  skipping ${email} — no such user`); continue; }
    const id = u.rows[0].id;
    const p = await db.execute({
      sql: "SELECT id FROM Profile WHERE userId = ? ORDER BY isOwner DESC, createdAt ASC LIMIT 1",
      args: [id],
    });
    if (p.rows.length === 0) { console.warn(`⚠️  skipping ${email} — no profile/card`); continue; }
    const key = email.split("@")[0].replace(/[^a-z0-9]/gi, "");
    targets.push({ email, key, id, username: u.rows[0].username, profileId: p.rows[0].id });
    // Mark their card as owner so the "My card" highlight + /u page work.
    await db.execute({ sql: "UPDATE Profile SET isOwner = 1 WHERE id = ?", args: [p.rows[0].id] });
  }
  if (targets.length === 0) throw new Error("No valid target accounts found.");

  // --- Clean previous demo data (children first) ---
  for (const sql of [
    "DELETE FROM UserConnection WHERE id LIKE 'demouc-%'",
    "DELETE FROM Reaction WHERE id LIKE 'demoreact-%'",
    "DELETE FROM Comment WHERE id LIKE 'democomment-%'",
    "DELETE FROM MessageReaction WHERE id LIKE 'demomr-%'",
    "DELETE FROM Message WHERE id LIKE 'demomsg-%'",
    "DELETE FROM ConversationParticipant WHERE id LIKE 'demopart-%'",
    "DELETE FROM Conversation WHERE id LIKE 'democonv-%'",
    "DELETE FROM Post WHERE id LIKE 'demopost-%'",
    "DELETE FROM Connection WHERE id LIKE 'democonn-%'",
    "DELETE FROM Scan WHERE id LIKE 'demoscan-%'",
    "DELETE FROM Profile WHERE id LIKE 'demoprofile-%'",
    "DELETE FROM User WHERE id LIKE 'demo-%'",
  ]) {
    await db.execute(sql);
  }

  const stmts = [];
  const postMeta = []; // { id, authorId } — collected to seed reactions afterward

  // Inbound connect-form submitters (their email is the only human label the
  // Connection model stores — encrypted at rest, decrypted in-app for display).
  const REQUESTERS = [
    "jordan.lee@example.com", "priya.shah@example.com", "marco.ruiz@example.com",
    "dana.white@example.com", "sam.okoro@example.com", "elena.volkov@example.com",
  ];
  // status + minutes-ago, applied to every card so dashboards look alive.
  const REQ_PLAN = [
    ["pending", 20], ["pending", 75], ["pending", 130],
    ["confirmed", 240], ["confirmed", 800], ["declined", 1100],
  ];
  // Seed scans + connection requests on one profile (used for demo cards AND targets).
  const addCardActivity = (profileId, keyPrefix) => {
    REQ_PLAN.forEach(([status, mins], i) => {
      const email = REQUESTERS[i % REQUESTERS.length];
      stmts.push({
        sql: "INSERT INTO Connection (id, profileId, emailEnc, emailHash, status, createdAt) VALUES (?,?,?,?,?,?)",
        args: [
          `democonn-${keyPrefix}-${i}`, profileId,
          canEncrypt ? encrypt(email) : null, canEncrypt ? sha256(email) : null,
          status, iso(mins),
        ],
      });
    });
    [8, 25, 60, 140, 400, 1300].forEach((mins, i) => {
      stmts.push({
        sql: "INSERT INTO Scan (id, profileId, userAgent, createdAt) VALUES (?,?,?,?)",
        args: [`demoscan-${keyPrefix}-${i}`, profileId, "Mozilla/5.0 (demo seed)", iso(mins)],
      });
    });
  };

  // --- Shared demo connections: user + card + posts ---
  for (const c of CONNECTIONS) {
    const uid = `demo-${c.username}`;
    stmts.push({
      sql: "INSERT INTO User (id, username, email, emailVerified, isAdmin, passwordHash, createdAt) VALUES (?,?,?,1,0,?,?)",
      args: [uid, c.username, `${c.username}@example.com`, pw, iso(5000)],
    });
    stmts.push({
      sql: "INSERT INTO Profile (id, slug, name, headline, headshotUrl, email, phone, linkedinUrl, githubUrl, template, cardTemplate, colorScheme, font, isOwner, isQREnabled, allowConnectionQrShare, userId, createdAt, updatedAt) VALUES (?,?,?,?,?, ?,?,?,?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)",
      args: [`demoprofile-${c.username}`, c.slug, c.name, c.headline, c.headshot, c.email ?? null, c.phone ?? null, c.linkedin ?? null, c.github ?? null, c.template ?? "classic", c.cardTemplate ?? null, c.palette, c.font ?? "sans", c.share, uid, iso(5000), iso(5000)],
    });
    [...c.posts, ...(EXTRA[c.username] ?? [])].forEach((post, i) => {
      stmts.push({
        sql: "INSERT INTO Post (id, authorId, content, mediaUrl, mediaType, linkUrl, tags, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [
          `demopost-${c.username}-${i}`, uid, post.content,
          post.mediaUrl ?? null, post.mediaType ?? null, post.linkUrl ?? null,
          post.tags ? JSON.stringify(post.tags) : null, iso(post.mins), iso(post.mins),
        ],
      });
      postMeta.push({ id: `demopost-${c.username}-${i}`, authorId: uid });
    });
    // Give each demo card its own scans + requests so logging in as @ava etc.
    // shows a populated dashboard (pending requests, stats, activity).
    addCardActivity(`demoprofile-${c.username}`, c.username);
  }

  // Mutual edge helper (both directions).
  const link = (aId, bId, tag) => {
    stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`demouc-${tag}-fwd`, aId, bId, iso(4000)] });
    stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`demouc-${tag}-rev`, bId, aId, iso(4000)] });
  };

  // --- Per-target: connect to every demo connection, own posts, activity ---
  targets.forEach((t, ti) => {
    for (const c of CONNECTIONS) link(t.id, `demo-${c.username}`, `${t.key}-${c.username}`);

    // Spread MY_POSTS across the target accounts (round-robin) so no two targets
    // post the same picture/text in the shared feed.
    MY_POSTS.forEach((post, i) => {
      if (i % targets.length !== ti) return;
      stmts.push({
        sql: "INSERT INTO Post (id, authorId, content, mediaUrl, mediaType, linkUrl, tags, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [
          `demopost-${t.key}-${i}`, t.id, post.content,
          post.mediaUrl ?? null, post.mediaType ?? null, post.linkUrl ?? null,
          post.tags ? JSON.stringify(post.tags) : null, iso(post.mins), iso(post.mins),
        ],
      });
      postMeta.push({ id: `demopost-${t.key}-${i}`, authorId: t.id });
    });

    addCardActivity(t.profileId, t.key);
  });

  // --- Connect the real targets to each other (every pair) ---
  for (let i = 0; i < targets.length; i++)
    for (let j = i + 1; j < targets.length; j++)
      link(targets[i].id, targets[j].id, `${targets[i].key}-${targets[j].key}`);

  // --- Seeded reactions: vary count + emoji per post so the feed feels alive ---
  const EMOJI = ["👍", "❤️", "🎉", "💡", "👏", "😂"];
  const allReactors = [...CONNECTIONS.map((c) => `demo-${c.username}`), ...targets.map((t) => t.id)];
  let rid = 0;
  postMeta.forEach((p, pi) => {
    const pool = allReactors.filter((u) => u !== p.authorId); // not your own post
    const n = Math.min(pool.length, 2 + ((pi * 5 + 3) % Math.max(1, pool.length - 1)));
    for (let k = 0; k < n; k++) {
      const userId = pool[(pi + k) % pool.length];
      const emoji = EMOJI[(pi + k) % EMOJI.length];
      stmts.push({
        sql: "INSERT INTO Reaction (id, postId, userId, emoji, createdAt) VALUES (?,?,?,?,?)",
        args: [`demoreact-${rid++}`, p.id, userId, emoji, iso(pi * 3 + k)],
      });
    }
  });

  // --- Seeded comments + replies (so threads feel real) ---
  const COMMENT_LINES = [
    "This is great — congrats! 🎉", "Love this. Saving for later.", "So well put — couldn't agree more.",
    "Huge. Thanks for sharing the details.", "This resonates a lot right now.", "Inspiring stuff 🙌",
    "Needed to hear this today.", "Spot on, especially the last point.", "Big fan of this approach.",
    "Adding this to my notes 📝", "How did the rollout go on your end?", "Curious what tooling you used here?",
  ];
  const REPLY_LINES = ["Thank you! 🙏", "Appreciate that!", "Glad it landed 😄", "100% — let's chat more.", "Means a lot, thanks!", "Happy to share more, DM me."];
  let cid = 0;
  postMeta.forEach((p, pi) => {
    const pool = allReactors.filter((u) => u !== p.authorId);
    const nComments = pi % 4 === 0 ? 0 : 1 + (pi % 3); // 0..3
    for (let k = 0; k < nComments; k++) {
      const commenter = pool[(pi * 2 + k) % pool.length];
      const commentId = `democomment-${cid++}`;
      stmts.push({
        sql: "INSERT INTO Comment (id, postId, authorId, parentId, body, createdAt) VALUES (?,?,?,?,?,?)",
        args: [commentId, p.id, commenter, null, COMMENT_LINES[(pi + k) % COMMENT_LINES.length], iso(pi * 2 + k)],
      });
      if ((pi + k) % 3 === 0) {
        const replier = (pi + k) % 2 === 0 ? p.authorId : pool[(pi + k + 1) % pool.length];
        stmts.push({
          sql: "INSERT INTO Comment (id, postId, authorId, parentId, body, createdAt) VALUES (?,?,?,?,?,?)",
          args: [`democomment-${cid++}`, p.id, replier, commentId, REPLY_LINES[(pi + k) % REPLY_LINES.length], iso(Math.max(0, pi * 2 + k - 1))],
        });
      }
    }
  });

  // --- Seeded conversations: DMs (with shared posts + reactions) + a group room ---
  let convN = 0, msgN = 0, mrN = 0;
  const makeConvo = ({ isGroup = false, name = null, creator, members, admins = [], msgs }) => {
    const cid = `democonv-${convN++}`;
    stmts.push({ sql: "INSERT INTO Conversation (id, isGroup, name, createdById, createdAt, updatedAt) VALUES (?,?,?,?,?,?)", args: [cid, isGroup ? 1 : 0, name, creator, iso(2000), iso(5)] });
    const all = [creator, ...members.filter((m) => m !== creator)];
    const adminSet = new Set(isGroup ? [creator, ...admins] : []);
    all.forEach((uid, i) => {
      stmts.push({ sql: "INSERT INTO ConversationParticipant (id, conversationId, userId, isAdmin, createdAt) VALUES (?,?,?,?,?)", args: [`demopart-${cid}-${i}`, cid, uid, adminSet.has(uid) ? 1 : 0, iso(2000)] });
    });
    msgs.forEach((m) => {
      const mid = `demomsg-${msgN++}`;
      stmts.push({ sql: "INSERT INTO Message (id, conversationId, senderId, body, sharedPostId, createdAt) VALUES (?,?,?,?,?,?)", args: [mid, cid, m.from, m.body ?? null, m.shared ?? null, iso(m.mins)] });
      (m.reacts ?? []).forEach((r) => {
        stmts.push({ sql: "INSERT INTO MessageReaction (id, messageId, userId, emoji, createdAt) VALUES (?,?,?,?,?)", args: [`demomr-${mrN++}`, mid, r.by, r.emoji, iso(m.mins)] });
      });
    });
  };
  const U = (n) => `demo-${n}`;
  makeConvo({ creator: U("liam"), members: [U("ava")], msgs: [
    { from: U("liam"), mins: 120, body: "Hey Ava! Loved your onboarding post — those drop-off numbers are wild. 👀" },
    { from: U("ava"), mins: 110, body: "Thanks Liam! Happy to walk you through what we changed.", reacts: [{ by: U("liam"), emoji: "❤️" }] },
    { from: U("liam"), mins: 90, body: "Would love that. Also — thought of you, sharing this:" },
    { from: U("liam"), mins: 89, shared: "demopost-sofia-1", reacts: [{ by: U("ava"), emoji: "🎉" }] },
    { from: U("ava"), mins: 30, body: "Oh this is perfect, thank you! 🙌" },
  ] });
  makeConvo({ creator: U("sofia"), members: [U("ava")], msgs: [
    { from: U("sofia"), mins: 200, body: "Coffee this week? Want to pick your brain on research ops." },
    { from: U("ava"), mins: 180, body: "Yes! Thursday works 😄", reacts: [{ by: U("sofia"), emoji: "👍" }] },
  ] });
  makeConvo({ creator: U("noah"), members: [U("maya")], msgs: [
    { from: U("noah"), mins: 300, body: "Congrats on crossing 1k users 🎉 huge milestone.", reacts: [{ by: U("maya"), emoji: "❤️" }] },
    { from: U("maya"), mins: 290, body: "Thank you! Couldn't have done it without the early believers." },
  ] });
  if (targets[0]) {
    makeConvo({ creator: targets[0].id, members: [U("ava")], msgs: [
      { from: targets[0].id, mins: 60, body: "Welcome to the network! 👋 Great to be connected." },
      { from: U("ava"), mins: 55, body: "Likewise — excited to keep in touch here!" },
    ] });
  }
  makeConvo({ isGroup: true, name: "Demo Day Crew", creator: U("ava"), admins: [U("maya")],
    members: [U("liam"), U("sofia"), U("maya"), U("noah")], msgs: [
    { from: U("ava"), mins: 500, body: "Welcome to the Demo Day crew! 🎉 Let's keep each other posted on launches." },
    { from: U("liam"), mins: 480, body: "Pumped to be here.", reacts: [{ by: U("ava"), emoji: "👏" }, { by: U("sofia"), emoji: "🎉" }] },
    { from: U("sofia"), mins: 460, body: "Sharing the deck from today 👇" },
    { from: U("noah"), mins: 300, body: "Who's up for a working session Friday?" },
    { from: U("maya"), mins: 120, body: "I'm in — I'll book a room. 📅", reacts: [{ by: U("noah"), emoji: "👍" }] },
  ] });

  await db.batch(stmts, "write");

  const postsPer = CONNECTIONS.reduce((n, c) => n + c.posts.length, 0) + MY_POSTS.length;
  console.log(`✅ Seeded ${targets.length} account(s): ${targets.map((t) => `@${t.username}`).join(", ")}`);
  console.log(`   ${CONNECTIONS.length} shared connections; each target sees ~${postsPer} posts + the other target's posts.`);
  console.log(`   Real accounts are now connected to each other.`);
  console.log(`   Feed: /feed  ·  Dashboard: /dashboard  ·  A connection: /u/ava`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => db.close());

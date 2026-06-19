// Phase 2 seed for the 5 accounts created via the real signup route
// (renee_caldwell, marcus_webb, priya_devan, tasha_brooks, gloria_mendez).
//
// Gives each account a full card (unique design), persona-appropriate feed posts,
// and mutual network connections to a few existing demo seed profiles (+ light
// interconnection among the 5 themselves).
//
// Images are EXTERNAL URLs on purpose (pravatar headshots, verified Unsplash post
// media) because the prod Supabase Storage project is dead — external URLs render
// on Vercel where uploaded files would 404.
//
// Idempotent: only touches rows with newcard-/newpost-/newuc- id prefixes (deletes
// them before re-insert). It NEVER deletes the User accounts (those came from the
// real signup route and must persist).
//
//   node scripts/seed-new-accounts.mjs        # targets PROD (reads .env.vercel)
//
import dotenv from "dotenv";
dotenv.config({ path: ".env.vercel" });
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
if (!process.env.TURSO_AUTH_TOKEN) {
  console.error("❌ No TURSO_AUTH_TOKEN — refusing to run against the local file by mistake.");
  process.exit(1);
}

const iso = (minsAgo = 0) =>
  new Date(Date.now() - minsAgo * 60_000).toISOString().replace("Z", "+00:00");
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const IMG = {
  desk: U("1486312338219-ce68d2c6f44d"),
  meeting: U("1600880292203-757bb62b4baf"),
  office: U("1559136555-9303baea8ebd"),
  teamMeetup: U("1528605248644-14dd04022da1"),
  analytics: U("1551288049-bebda4e38f71"),
  coffee: U("1521737604893-d14cc237f11d"),
  code: U("1555066931-4365d14bab8c"),
  teamDinner: U("1552674605-db6ffd4facb5"),
  celebration: U("1531058020387-3be344556be6"),
  chartsBoard: U("1454165804606-c3d57bc86b40"),
};

// label, persona, unique card design, contact info, posts, and who to connect to.
// `connectTo` mixes existing demo user ids (demo-*) and new-account usernames.
const PEOPLE = [
  {
    username: "renee_caldwell", name: "Renee Caldwell",
    headline: "Property Manager · resident-first communities",
    headshot: "https://i.pravatar.cc/240?img=45",
    template: "classic", cardTemplate: "portrait", palette: "forest", font: "humanist",
    phone: "+1 (555) 204-7781", linkedin: "https://linkedin.com/in/reneecaldwell",
    posts: [
      { mins: 60, content: "Hit 97% occupancy across the portfolio this month. The secret isn't rent specials — it's answering maintenance tickets within 24 hours. Residents stay where they feel heard. 🏡", tags: ["propertymanagement", "residents"] },
      { mins: 540, content: "Resident appreciation BBQ this weekend — 120 neighbors, zero complaints, three lease renewals signed on the spot. Community IS retention.", mediaUrl: IMG.teamDinner, mediaType: "image", tags: ["community", "events"] },
      { mins: 1320, content: "Tip for new property managers: build the vendor relationship BEFORE the emergency. The plumber who picks up at 11pm is worth more than any contract.", tags: ["propertymanagement"] },
    ],
    connectTo: ["demo-david", "demo-maya", "marcus_webb", "gloria_mendez"],
  },
  {
    username: "marcus_webb", name: "Marcus Webb",
    headline: "Regional Property Director · multifamily portfolios",
    headshot: "https://i.pravatar.cc/240?img=11",
    template: "bold", cardTemplate: "wordmark", palette: "burgundy", font: "slab",
    phone: "+1 (555) 661-3390", linkedin: "https://linkedin.com/in/marcuswebb",
    posts: [
      { mins: 120, content: "Closed Q2 with NOI up 8% across 2,400 units. Operational discipline beats market timing every time. Proud of these site teams. 📈", mediaUrl: IMG.chartsBoard, mediaType: "image", tags: ["multifamily", "operations"] },
      { mins: 880, content: "Walked four properties today. You learn more about an asset in one walk-through than in a month of spreadsheets. Boots on the ground, always.", mediaUrl: IMG.office, mediaType: "image", tags: ["propertymanagement"] },
      { mins: 2100, content: "Hiring two Community Managers for our southern region — people-first leaders who treat a 300-unit community like a small business. DM me.", tags: ["hiring", "realestate"] },
    ],
    connectTo: ["demo-david", "demo-liam", "renee_caldwell", "gloria_mendez"],
  },
  {
    username: "priya_devan", name: "Priya Devan",
    headline: "Senior Software Engineer · platform & APIs",
    headshot: "https://i.pravatar.cc/240?img=44",
    template: "sidebar", cardTemplate: "corporate", palette: "marine", font: "mono",
    phone: "+1 (555) 778-2255", linkedin: "https://linkedin.com/in/priyadevan", github: "https://github.com/priyadevan",
    posts: [
      { mins: 45, content: "Shipped a rate-limiter rewrite that cut our p99 from 800ms to 120ms. The fix wasn't clever code — it was deleting a cache nobody understood. 🧹", mediaUrl: IMG.code, mediaType: "image", tags: ["engineering", "performance"] },
      { mins: 700, content: "Reviewing a PR is mentoring in disguise. Leave the comment that explains WHY, not just what to change.", tags: ["engineering", "mentorship"] },
      { mins: 1600, content: "Open-sourced our API pagination helper today. Small library, but it's saved my team a dozen off-by-one bugs.", linkUrl: "https://github.com/", tags: ["opensource"] },
    ],
    connectTo: ["demo-noah", "demo-sofia", "demo-marcus"],
  },
  {
    username: "tasha_brooks", name: "Tasha Brooks",
    headline: "HR Business Partner · people & culture",
    headshot: "https://i.pravatar.cc/240?img=26",
    template: "spotlight", cardTemplate: "monogram", palette: "blush", font: "elegant",
    phone: "+1 (555) 909-1142", linkedin: "https://linkedin.com/in/tashabrooks",
    posts: [
      { mins: 90, content: "Reminder to every manager: people don't leave companies, they leave unclear expectations and unheard feedback. Culture is a daily practice, not a poster. 💬", tags: ["hr", "culture"] },
      { mins: 620, content: "Wrapped our quarterly L&D cohort — 40 employees, 6 weeks, real skills. Investing in people isn't a perk, it's the strategy.", mediaUrl: IMG.meeting, mediaType: "image", tags: ["learning", "people"] },
      { mins: 1500, content: "We rewrote every job description to lead with impact instead of a laundry list of requirements. Qualified-applicant rate went up 35%.", tags: ["hiring", "hr"] },
    ],
    connectTo: ["demo-priya", "demo-ava", "demo-david"],
  },
  {
    username: "gloria_mendez", name: "Gloria Mendez",
    headline: "Operations & Finance Lead · scaling ops",
    headshot: "https://i.pravatar.cc/240?img=31",
    template: "split", cardTemplate: "duo", palette: "sky", font: "sans",
    phone: "+1 (555) 432-8876", linkedin: "https://linkedin.com/in/gloriamendez",
    posts: [
      { mins: 150, content: "Closed the books two days early this quarter. Clean process beats heroics — automate the boring 80% so the team can think about the 20% that matters. 📊", mediaUrl: IMG.analytics, mediaType: "image", tags: ["finance", "operations"] },
      { mins: 760, content: "Renegotiated three vendor contracts this month and saved 14% with zero service cuts. Ask for the better rate — the worst they say is no.", tags: ["operations", "finance"] },
      { mins: 1900, content: "Ops lesson learned the hard way: a process that lives in one person's head isn't a process, it's a risk. Write it down.", mediaUrl: IMG.coffee, mediaType: "image", tags: ["operations"] },
    ],
    connectTo: ["demo-liam", "demo-david", "renee_caldwell", "marcus_webb"],
  },
];

async function main() {
  // Resolve usernames -> ids for the 5 new accounts.
  const handles = PEOPLE.map((p) => p.username);
  const rows = (await db.execute({
    sql: `SELECT id, username FROM User WHERE username IN (${handles.map(() => "?").join(",")})`,
    args: handles,
  })).rows;
  const idByUsername = Object.fromEntries(rows.map((r) => [r.username, r.id]));
  for (const h of handles) {
    if (!idByUsername[h]) throw new Error(`Account @${h} not found — run the signup step first.`);
  }

  // Clean previous Phase-2 data (children first). Accounts are NOT touched.
  for (const sql of [
    "DELETE FROM UserConnection WHERE id LIKE 'newuc-%'",
    "DELETE FROM Post WHERE id LIKE 'newpost-%'",
    "DELETE FROM Profile WHERE id LIKE 'newcard-%'",
  ]) {
    await db.execute(sql);
  }

  const stmts = [];

  for (const p of PEOPLE) {
    const uid = idByUsername[p.username];
    // One unique owner card per account.
    stmts.push({
      sql: "INSERT INTO Profile (id, slug, name, headline, headshotUrl, email, phone, linkedinUrl, githubUrl, template, cardTemplate, colorScheme, font, isOwner, isQREnabled, allowConnectionQrShare, userId, createdAt, updatedAt) VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?,?, 1,1,0, ?, ?, ?)",
      args: [
        `newcard-${p.username}`, randomUUID(), p.name, p.headline, p.headshot,
        `${p.username.replace(/_/g, ".")}@example.com`, p.phone ?? null, p.linkedin ?? null, p.github ?? null,
        p.template, p.cardTemplate, p.palette, p.font, uid, iso(3000), iso(3000),
      ],
    });
    // Persona posts.
    p.posts.forEach((post, i) => {
      stmts.push({
        sql: "INSERT INTO Post (id, authorId, content, mediaUrl, mediaType, linkUrl, tags, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [
          `newpost-${p.username}-${i}`, uid, post.content,
          post.mediaUrl ?? null, post.mediaType ?? null, post.linkUrl ?? null,
          post.tags ? JSON.stringify(post.tags) : null, iso(post.mins), iso(post.mins),
        ],
      });
    });
  }

  // Mutual network edges (both directions), de-duplicated.
  const seen = new Set();
  const link = (aId, bId, tag) => {
    const key = [aId, bId].sort().join(">"); // direction-agnostic: A↔B counted once
    if (seen.has(key)) return;
    seen.add(key);
    stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`newuc-${tag}-f`, aId, bId, iso(2900)] });
    stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`newuc-${tag}-r`, bId, aId, iso(2900)] });
  };
  PEOPLE.forEach((p, pi) => {
    const aId = idByUsername[p.username];
    p.connectTo.forEach((target, ti) => {
      const bId = idByUsername[target] ?? (target.startsWith("demo-") ? target : null);
      if (!bId) return;
      link(aId, bId, `${pi}-${ti}-${p.username}`);
    });
  });

  await db.batch(stmts, "write");

  console.log(`✅ Seeded ${PEOPLE.length} accounts on PROD:`);
  for (const p of PEOPLE) {
    console.log(`   @${p.username}  ·  ${p.name}  ·  ${p.headline}  ·  ${p.posts.length} posts  ·  ${p.connectTo.length} connections`);
  }
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => db.close());

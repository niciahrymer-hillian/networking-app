// Seed a varied batch of timely feed posts (charity, job fair, promotions, recruiter,
// Father's Day, Juneteenth, industry FYIs, vacation/candid) authored by the existing
// demo cast + two new accounts (a recruiter + a community organizer). Idempotent:
// rows use evt-/evtuc-/seed2- prefixes and are deleted before re-insert. Targets PROD.
//
//   node scripts/seed-event-posts.mjs
import dotenv from "dotenv";
dotenv.config({ path: ".env.vercel" });
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { createCipheriv, createHash, randomBytes, randomUUID } from "crypto";

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
if (!process.env.TURSO_AUTH_TOKEN) { console.error("❌ no TURSO_AUTH_TOKEN"); process.exit(1); }

const iso = (mins = 0) => new Date(Date.now() - mins * 60_000).toISOString().replace("Z", "+00:00");
const KEY = process.env.ENCRYPTION_KEY;
const encrypt = (t) => { const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", Buffer.from(KEY, "hex"), iv); const e = Buffer.concat([c.update(t, "utf8"), c.final()]); return Buffer.concat([iv, c.getAuthTag(), e]).toString("base64"); };
const emailHash = (t) => createHash("sha256").update(t.toLowerCase().trim()).digest("hex");
const pw = bcrypt.hashSync("Connect123!", 10);

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const IMG = { // verified-200 Unsplash ids reused from the demo seed
  charity: U("1556761175-4b46a572b786"), teamMeetup: U("1528605248644-14dd04022da1"),
  conference: U("1540575467063-178a50c2df87"), celebration: U("1531058020387-3be344556be6"),
  teamDinner: U("1552674605-db6ffd4facb5"), dinnerTable: U("1517457373958-b7bdd4587205"),
  party: U("1530103862676-de8c9debad1d"), design: U("1497032628192-86f99bcd76bc"),
  code: U("1555066931-4365d14bab8c"), whiteboard: U("1517245386807-bb43f82c33c4"),
  hike: U("1476514525535-07fb3b4ae5f1"), sunset: U("1500534314209-a25ddb2bd429"),
  beach: U("1507525428034-b723cf961d3e"), camping: U("1533105079780-92b9be482077"),
  roadTrip: U("1469854523086-cc02fe5d8800"), coffee: U("1521737604893-d14cc237f11d"),
};

// Two new accounts authoring the recruiter/community posts.
const NEW = [
  { id: "seed2-devin", username: "devin_carter", name: "Devin Carter", headshot: "https://i.pravatar.cc/240?img=15",
    headline: "Technical Recruiter · connecting talent to teams", email: "devin.carter@example.com",
    skills: ["Technical Recruiting", "Sourcing", "Talent", "Interviewing"],
    experience: [{ role: "Technical Recruiter", org: "Beacon Talent", period: "2020 – present", summary: "Hired 120+ engineers, designers, and PMs." }],
    education: [{ school: "Drexel University", credential: "BA, Communications", period: "2012 – 2016" }] },
  { id: "seed2-aaliyah", username: "aaliyah_foster", name: "Aaliyah Foster", headshot: "https://i.pravatar.cc/240?img=24",
    headline: "Community Organizer · nonprofit & education", email: "aaliyah.foster@example.com",
    skills: ["Community Building", "Nonprofit", "Event Planning", "Fundraising"],
    experience: [{ role: "Community Organizer", org: "Bright Futures Collective", period: "2019 – present", summary: "Runs STEM-access programs for local youth." }],
    education: [{ school: "Howard University", credential: "BA, Sociology", period: "2011 – 2015" }] },
];

// author username, content, optional image, tags, minutes-ago
const POSTS = [
  // --- Charity event (flyer / FYI) ---
  { a: "aaliyah_foster", mins: 40, img: IMG.charity, tags: ["charity", "community", "event"],
    c: "📣 FLYER — Community Coding Camp Fundraiser, THIS Saturday 10am @ Riverside Center. Every dollar puts a laptop in a kid's hands. Raffle, food trucks, and a 5K. Bring a friend! 💚" },
  // --- Job fair ---
  { a: "devin_carter", mins: 75, img: IMG.conference, tags: ["jobfair", "hiring", "careers"],
    c: "🎪 TECH JOB FAIR — Thursday June 25, 11am–4pm at the Convention Center. 40+ companies hiring across engineering, design, data & product. Bring resumés, leave with interviews. Free entry! 🎟️" },
  // --- Recruiter looking for applicants ---
  { a: "devin_carter", mins: 200, tags: ["hiring", "recruiting", "jobs"],
    c: "🚀 I'm hiring this month: 2× Senior Frontend, 1× Data Engineer, 1× Product Designer, 1× DevRel. Remote-friendly, strong teams, real ownership. Is it you (or someone you rate)? DM me your story." },
  { a: "devin_carter", mins: 1300, tags: ["hiring", "fyi"],
    c: "Recruiter FYI: pay-transparency laws keep expanding. If your job posts don't list ranges yet, candidates notice — and skip. Add the range. 💼" },
  // --- Promotions ---
  { a: "noahkim", mins: 120, img: IMG.celebration, tags: ["promotion", "career", "milestone"],
    c: "Thrilled to share I've been promoted to Staff Engineer! 🎉 Grateful to the team and mentors who pushed me to think bigger. Onward. 🙏" },
  { a: "davidbrooks", mins: 520, tags: ["team", "milestone"],
    c: "Proud manager moment: three people on my team earned promotions this cycle. Watching folks level up is the whole job. 🧡" },
  // --- Father's Day (candid) ---
  { a: "davidbrooks", mins: 30, img: IMG.dinnerTable, tags: ["fathersday", "family"],
    c: "Happy Father's Day to the dads balancing spreadsheets and soccer practice. Took today off to be 'Coach Dad' — best title I've got. 👨‍👧‍👦🥎" },
  { a: "marcuslee", mins: 95, img: IMG.coffee, tags: ["fathersday"],
    c: "Grateful for my dad, who taught me every 'no' is just a 'not yet.' Happy Father's Day. ☕️🧡" },
  // --- Juneteenth ---
  { a: "aaliyah_foster", mins: 2700, img: IMG.party, tags: ["juneteenth", "community"],
    c: "Reflecting this Juneteenth on freedom, community, and the work still ahead. Spent the morning at our neighborhood celebration — music, food, and history. 🤎✊🏾" },
  { a: "sofiagomez", mins: 2850, tags: ["juneteenth", "dei"],
    c: "Juneteenth reminder: representation in tech isn't a checkbox, it's a commitment. Celebrating today, recommitting tomorrow. ✊🏾" },
  // --- Industry-specific FYI ---
  { a: "avachen", mins: 300, img: IMG.design, tags: ["design", "accessibility"],
    c: "Design FYI: WCAG 2.2 is worth a read this week — the new focus-appearance and target-size criteria will change how we build forms and buttons. 🎨" },
  { a: "sofiagomez", mins: 420, tags: ["data", "ml"],
    c: "FYI for data folks: moving our feature store to a streaming setup cut training-serving skew dramatically. Happy to share notes if useful. 📊" },
  { a: "noahkim", mins: 640, img: IMG.code, tags: ["react", "webdev"],
    c: "Industry tip: React Server Components finally clicked for me when I stopped thinking in 'pages' and started thinking in 'data boundaries.' ⚛️" },
  { a: "priyanair", mins: 780, tags: ["product", "pm"],
    c: "PM FYI: the best discovery tool I've found this year is a one-sentence problem statement. If I can't write it, the feature isn't ready. 📦" },
  // --- Vacation / candid photos ---
  { a: "liampatel", mins: 1500, img: IMG.hike, tags: ["timeoff"],
    c: "Logged off for a long weekend in the mountains. Best growth strategy is sometimes touching grass. 🏔️" },
  { a: "elenapetrova", mins: 1700, img: IMG.sunset, tags: ["timeoff"],
    c: "Sunset, a paperback, and zero notifications. Recharging so the research brain can keep going. 🌅" },
  { a: "noahkim", mins: 2000, img: IMG.camping, tags: ["balance"],
    c: "Closed the laptop, opened a tent. The best debugger is a campfire and no signal. 🔥" },
  { a: "mayaokafor", mins: 900, img: IMG.whiteboard, tags: ["startups"],
    c: "Candid from today's offsite — whiteboards, sticky notes, and one big question: what do we say no to? 🚀" },
  { a: "marcuslee", mins: 2300, img: IMG.roadTrip, tags: ["timeoff"],
    c: "Road trip between conferences — zero talks to prep, 100% playlists. 🚗" },
  { a: "avachen", mins: 1100, img: IMG.beach, tags: ["timeoff"],
    c: "A few days by the coast. My best design ideas always show up the moment I stop staring at a screen. 🌊" },
];

async function main() {
  const niciahr = (await db.execute("SELECT id FROM User WHERE username='niciahr'")).rows[0]?.id;
  if (!niciahr) throw new Error("niciahr account not found");

  // --- Clean prior runs (children first) ---
  for (const sql of [
    "DELETE FROM Post WHERE id LIKE 'evt-%'",
    "DELETE FROM UserConnection WHERE id LIKE 'evtuc-%'",
    "DELETE FROM Profile WHERE id LIKE 'seed2card-%'",
    "DELETE FROM User WHERE id LIKE 'seed2-%'",
  ]) await db.execute(sql);

  const stmts = [];

  // --- New accounts + owner cards + structured profile ---
  for (const n of NEW) {
    stmts.push({ sql: "INSERT INTO User (id, username, name, avatarUrl, email, emailEnc, emailHash, emailVerified, isAdmin, passwordHash, experience, education, skills, openToWork, createdAt) VALUES (?,?,?,?,?,?,?,1,0,?,?,?,?,0,?)",
      args: [n.id, n.username, n.name, n.headshot, null, KEY ? encrypt(n.email) : null, KEY ? emailHash(n.email) : null, pw, JSON.stringify(n.experience), JSON.stringify(n.education), JSON.stringify(n.skills), iso(6000)] });
    stmts.push({ sql: "INSERT INTO Profile (id, slug, name, headline, headshotUrl, email, template, colorScheme, font, isOwner, isQREnabled, allowConnectionQrShare, userId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,1,1,0,?,?,?)",
      args: [`seed2card-${n.username}`, randomUUID(), n.name, n.headline, n.headshot, n.email, "classic", "emerald", "sans", n.id, iso(6000), iso(6000)] });
    // Connect to niciahr + a few demo accounts so their posts land in the feed.
    let i = 0;
    for (const other of [niciahr, "demo-ava", "demo-david", "demo-liam"]) {
      stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`evtuc-${n.username}-${i}f`, n.id, other, iso(5500)] });
      stmts.push({ sql: "INSERT INTO UserConnection (id, userId, connectedUserId, createdAt) VALUES (?,?,?,?)", args: [`evtuc-${n.username}-${i}r`, other, n.id, iso(5500)] });
      i++;
    }
  }

  // --- Resolve author ids (existing demo accounts by username + the new ones) ---
  const usernames = [...new Set(POSTS.map((p) => p.a))];
  const rows = (await db.execute({ sql: `SELECT id, username FROM User WHERE username IN (${usernames.map(() => "?").join(",")})`, args: usernames })).rows;
  const idByUsername = Object.fromEntries(rows.map((r) => [r.username, r.id]));
  for (const n of NEW) idByUsername[n.username] = n.id; // not yet committed, but ids are known

  // --- Posts ---
  let i = 0;
  for (const p of POSTS) {
    const authorId = idByUsername[p.a];
    if (!authorId) { console.warn(`  ⚠️  skipping post — no author @${p.a}`); continue; }
    stmts.push({ sql: "INSERT INTO Post (id, authorId, content, mediaUrl, mediaType, tags, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)",
      args: [`evt-${i++}`, authorId, p.c, p.img ?? null, p.img ? "image" : null, JSON.stringify(p.tags), iso(p.mins), iso(p.mins)] });
  }

  await db.batch(stmts, "write");
  console.log(`✅ Seeded ${NEW.length} new accounts + ${i} posts (charity, job fair, promotions, recruiter, Father's Day, Juneteenth, industry FYIs, vacation/candid).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); }).finally(() => db.close());

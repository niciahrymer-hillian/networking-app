// Add reactions + comments to the seeded event posts (id LIKE 'evt-%') so the feed
// looks alive and the engagement notifications populate. Idempotent: rows use
// evtreact-/evtcomment- prefixes, deleted before re-insert. Targets PROD.
//
//   node scripts/seed-event-engagement.mjs
import dotenv from "dotenv";
dotenv.config({ path: ".env.vercel" });
import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
if (!process.env.TURSO_AUTH_TOKEN) { console.error("❌ no TURSO_AUTH_TOKEN"); process.exit(1); }
const iso = (mins = 0) => new Date(Date.now() - mins * 60_000).toISOString().replace("Z", "+00:00");

const EMOJI = ["👍", "❤️", "🎉", "💡", "👏", "😂"];
const COMMENTS = [
  "This is great — congrats! 🎉", "Love this. Saving it.", "Count me in! 🙌", "Sharing with my network.",
  "So well said.", "Needed this today.", "Huge. Thanks for posting.", "Inspiring stuff 👏",
  "Will definitely be there!", "Adding to my calendar 📅", "This resonates a lot.", "Big fan of this.",
  "Congrats — so deserved! 👏", "Beautiful 🌅", "Looks amazing!", "Appreciate you sharing this.",
];
const REPLIES = ["Thank you! 🙏", "Appreciate it!", "Means a lot 😊", "See you there!", "Thanks — DM me!"];

async function main() {
  const posts = (await db.execute("SELECT id, authorId FROM Post WHERE id LIKE 'evt-%' ORDER BY id")).rows;
  if (!posts.length) { console.log("No evt-* posts found — run seed-event-posts.mjs first."); return; }

  // Reactor/commenter pool: demo accounts + the two new accounts + niciahr + personas.
  const pool = (await db.execute(
    "SELECT id FROM User WHERE id LIKE 'demo-%' OR id LIKE 'seed2-%' OR username IN ('niciahr','renee_caldwell','marcus_webb','priya_devan','tasha_brooks','gloria_mendez')"
  )).rows.map((r) => r.id);

  await db.execute("DELETE FROM Reaction WHERE id LIKE 'evtreact-%'");
  await db.execute("DELETE FROM Comment WHERE id LIKE 'evtcomment-%'");

  const stmts = [];
  let rid = 0, cid = 0;

  posts.forEach((post, pi) => {
    const others = pool.filter((u) => u !== post.authorId);
    // Rotate the pool per post so reactors vary; 4–12 reactions each.
    const rotated = [...others.slice(pi % others.length), ...others.slice(0, pi % others.length)];
    const nReact = 4 + ((pi * 3 + 5) % Math.max(1, others.length - 3));
    for (let k = 0; k < Math.min(nReact, others.length); k++) {
      stmts.push({ sql: "INSERT INTO Reaction (id, postId, userId, emoji, createdAt) VALUES (?,?,?,?,?)",
        args: [`evtreact-${rid++}`, post.id, rotated[k], EMOJI[(pi + k) % EMOJI.length], iso(pi * 2 + k)] });
    }
    // 0–3 comments, some with a reply from the author.
    const nComment = pi % 4 === 0 ? 0 : 1 + (pi % 3);
    for (let k = 0; k < nComment; k++) {
      const commenter = rotated[(k + 2) % rotated.length];
      const commentId = `evtcomment-${cid++}`;
      stmts.push({ sql: "INSERT INTO Comment (id, postId, authorId, parentId, body, createdAt) VALUES (?,?,?,?,?,?)",
        args: [commentId, post.id, commenter, null, COMMENTS[(pi * 2 + k) % COMMENTS.length], iso(pi * 2 + k)] });
      if (k === 0 && pi % 2 === 0) {
        stmts.push({ sql: "INSERT INTO Comment (id, postId, authorId, parentId, body, createdAt) VALUES (?,?,?,?,?,?)",
          args: [`evtcomment-${cid++}`, post.id, post.authorId, commentId, REPLIES[pi % REPLIES.length], iso(pi * 2 + k - 1 < 0 ? 0 : pi * 2 + k - 1)] });
      }
    }
  });

  await db.batch(stmts, "write");
  console.log(`✅ Added ${rid} reactions + ${cid} comments across ${posts.length} event posts.`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); }).finally(() => db.close());

// Populate demo/persona accounts with structured profiles (experience, education,
// skills) and an "open to work" mix, so the new profile features are visible in the
// demo. Idempotent: updates by username (overwrites the fields). Targets PROD.
//
//   node scripts/seed-professional.mjs        # PROD (reads .env.vercel)
import dotenv from "dotenv";
dotenv.config({ path: ".env.vercel" });
import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
if (!process.env.TURSO_AUTH_TOKEN) { console.error("❌ no TURSO_AUTH_TOKEN"); process.exit(1); }

// username -> { open, skills[], experience[], education[] }
const P = {
  avachen: { open: false, skills: ["Product Design", "Figma", "UX Research", "Design Systems", "Prototyping"],
    experience: [{ role: "Senior Product Designer", org: "Lumen", period: "2022 – present", summary: "Lead designer on the core product; an onboarding redesign cut first-week churn 30%." }, { role: "Product Designer", org: "Brightway", period: "2019 – 2022", summary: "Redesigned mobile checkout (7 taps → 3)." }],
    education: [{ school: "Rhode Island School of Design", credential: "BFA, Graphic Design", period: "2015 – 2019" }] },
  liampatel: { open: false, skills: ["Growth Marketing", "SQL", "Lifecycle", "A/B Testing", "SEO"],
    experience: [{ role: "Head of Growth", org: "Northwind", period: "2021 – present", summary: "Lifted activation 41% by rewriting the lifecycle email sequence." }],
    education: [{ school: "University of Michigan", credential: "BBA, Marketing", period: "2014 – 2018" }] },
  sofiagomez: { open: true, skills: ["Python", "Machine Learning", "SQL", "Experimentation", "Feature Stores"],
    experience: [{ role: "Data Scientist", org: "Vela Analytics", period: "2021 – present", summary: "Shipped a churn model (precision 0.82) flagging at-risk accounts two weeks earlier." }],
    education: [{ school: "Georgia Tech", credential: "MS, Analytics", period: "2018 – 2020" }] },
  mayaokafor: { open: false, skills: ["Fundraising", "Product Strategy", "Building in Public", "Hiring"],
    experience: [{ role: "Founder & CEO", org: "Okafor Labs", period: "2023 – present", summary: "Bootstrapped to 1,000+ paying users." }],
    education: [{ school: "Howard University", credential: "BS, Computer Science", period: "2013 – 2017" }] },
  noahkim: { open: true, skills: ["React", "TypeScript", "Edge Functions", "Node.js", "Performance"],
    experience: [{ role: "Full-stack Engineer", org: "Relay", period: "2020 – present", summary: "Moved rendering to the edge; cut p95 latency 340ms → 90ms." }],
    education: [{ school: "UC Berkeley", credential: "BS, EECS", period: "2016 – 2020" }] },
  priyanair: { open: false, skills: ["Product Management", "0→1 Products", "Roadmapping", "User Research"],
    experience: [{ role: "Senior Product Manager", org: "Cascade", period: "2021 – present", summary: "Capped WIP at three and 3x'd roadmap clarity." }],
    education: [{ school: "Cornell University", credential: "BS, Information Science", period: "2014 – 2018" }] },
  davidbrooks: { open: false, skills: ["Partnerships", "Business Development", "Sales", "Negotiation"],
    experience: [{ role: "Head of Partnerships", org: "Meridian", period: "2019 – present", summary: "Closed multi-year partnerships that started as hallway conversations." }],
    education: [{ school: "NYU Stern", credential: "BS, Business", period: "2011 – 2015" }] },
  elenapetrova: { open: true, skills: ["UX Research", "Mixed Methods", "Usability Testing", "Survey Design"],
    experience: [{ role: "UX Researcher", org: "Northstar", period: "2020 – present", summary: "Turn messy interviews into roadmap decisions teams actually make." }],
    education: [{ school: "University of Washington", credential: "MS, HCI", period: "2017 – 2019" }] },
  marcuslee: { open: false, skills: ["Developer Relations", "Documentation", "Public Speaking", "Community"],
    experience: [{ role: "Developer Advocate", org: "Forge", period: "2021 – present", summary: "Run live coding workshops; treat docs as a product." }],
    education: [{ school: "UT Austin", credential: "BS, Computer Science", period: "2013 – 2017" }] },
  renee_caldwell: { open: false, skills: ["Property Management", "Resident Relations", "Leasing", "Vendor Management"],
    experience: [{ role: "Property Manager", org: "Cedar Ridge Communities", period: "2020 – present", summary: "97% occupancy via fast maintenance and community events." }],
    education: [{ school: "Temple University", credential: "BBA, Real Estate", period: "2012 – 2016" }] },
  marcus_webb: { open: false, skills: ["Multifamily", "Operations", "P&L", "Team Leadership"],
    experience: [{ role: "Regional Property Director", org: "Anchor Residential", period: "2018 – present", summary: "NOI +8% across 2,400 units." }],
    education: [{ school: "Penn State", credential: "BS, Finance", period: "2008 – 2012" }] },
  priya_devan: { open: true, skills: ["TypeScript", "APIs", "Distributed Systems", "Performance"],
    experience: [{ role: "Senior Software Engineer", org: "Kindling", period: "2020 – present", summary: "Rewrote the rate-limiter; p99 800ms → 120ms." }],
    education: [{ school: "University of Illinois", credential: "BS, Computer Science", period: "2013 – 2017" }] },
  tasha_brooks: { open: false, skills: ["People Operations", "Learning & Development", "Hiring", "Culture"],
    experience: [{ role: "HR Business Partner", org: "Brightline", period: "2019 – present", summary: "Rewrote job descriptions; +35% qualified applicants." }],
    education: [{ school: "Spelman College", credential: "BA, Psychology", period: "2011 – 2015" }] },
  gloria_mendez: { open: true, skills: ["Operations", "Finance", "Process Design", "Vendor Negotiation"],
    experience: [{ role: "Operations & Finance Lead", org: "Tidewater", period: "2021 – present", summary: "Closed the books two days early; saved 14% on vendor contracts." }],
    education: [{ school: "University of Texas", credential: "BBA, Finance", period: "2013 – 2017" }] },
  niciahr: { open: true, skills: ["Data Engineering", "SQL", "Python", "ETL", "Spark"],
    experience: [{ role: "Data Engineer Trainee", org: "Zipcode Wilmington", period: "2025 – present", summary: "Building data pipelines and full-stack applications." }],
    education: [{ school: "Zipcode Wilmington", credential: "Software Engineering", period: "2025" }] },
};

async function main() {
  let n = 0, open = 0;
  for (const [username, d] of Object.entries(P)) {
    const r = await db.execute({
      sql: 'UPDATE "User" SET experience=?, education=?, skills=?, openToWork=? WHERE username=?',
      args: [JSON.stringify(d.experience), JSON.stringify(d.education), JSON.stringify(d.skills), d.open ? 1 : 0, username],
    });
    if (r.rowsAffected > 0) { n++; if (d.open) open++; console.log(`  ✓ @${username}${d.open ? "  🟢 open to work" : ""}`); }
    else console.log(`  – @${username} not found (skipped)`);
  }
  console.log(`\n✅ Updated ${n} accounts (${open} marked open to work).`);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); }).finally(() => db.close());

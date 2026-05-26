import pkg from "@prisma/client";
const { PrismaClient } = pkg;

process.env.TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db";

const prisma = new PrismaClient();

async function main() {
  const profiles = [
    {
      slug: "ava-chen",
      name: "Ava Chen",
      email: "ava@sparklabs.com",
      phone: "+1 (555) 218-9371",
      headline: "Product Designer focused on seamless digital experiences.",
      about: "I design polished networking profiles that make it easy for clients and collaborators to connect instantly.",
      headshotUrl: "/images/avatar-ava.svg",
      linkedinUrl: "https://linkedin.com/in/ava-chen",
      githubUrl: "https://github.com/ava-chen",
      links: JSON.stringify([{ label: "Portfolio", url: "https://ava.design" }]),
    },
    {
      slug: "liam-patel",
      name: "Liam Patel",
      email: "liam@nexaventures.com",
      phone: "+1 (555) 402-1889",
      headline: "Growth marketer building data-driven campaigns.",
      about: "I help startups expand revenue with polished digital profiles, clear CTAs, and memorable outreach.",
      headshotUrl: "/images/avatar-liam.svg",
      linkedinUrl: "https://linkedin.com/in/liam-patel",
      githubUrl: "https://github.com/liam-patel",
      links: JSON.stringify([{ label: "Book time", url: "https://calendly.com/liam-patel" }]),
    },
    {
      slug: "sofia-gomez",
      name: "Sofia Gomez",
      email: "sofia@pulseanalytics.com",
      phone: "+1 (555) 624-7083",
      headline: "Data scientist turning analytics into action.",
      about: "I translate complex data into compelling stories and make every profile feel like the start of a meaningful connection.",
      headshotUrl: "/images/avatar-sofia.svg",
      linkedinUrl: "https://linkedin.com/in/sofia-gomez",
      githubUrl: "https://github.com/sofia-gomez",
      links: JSON.stringify([{ label: "Speaker Reel", url: "https://sofiagomez.com/speaking" }]),
    },
  ];

  for (const profile of profiles) {
    await prisma.profile.upsert({
      where: { slug: profile.slug },
      update: profile,
      create: profile,
    });
  }

  console.log("Seed complete: dummy profiles created or updated.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

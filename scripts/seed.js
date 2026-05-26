const { execSync } = require("child_process");
const bcrypt = require("bcryptjs");

const defaultPasswordHash = bcrypt.hashSync("Connect123!", 10);

const sql = `
INSERT INTO Profile (id, slug, name, email, phone, headline, about, headshotUrl, linkedinUrl, githubUrl, links, isOwner, isQREnabled, createdAt, updatedAt)
VALUES
  ('profile-ava-chen', 'ava-chen', 'Ava Chen', 'ava@sparklabs.com', '+1 (555) 218-9371', 'Product Designer focused on seamless digital experiences.', 'I design polished networking profiles that make it easy for clients and collaborators to connect instantly.', '/images/avatar-ava.svg', 'https://linkedin.com/in/ava-chen', 'https://github.com/ava-chen', '{"label":"Portfolio","url":"https://ava.design"}', 0, 1, datetime('now'), datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    name=excluded.name,
    email=excluded.email,
    phone=excluded.phone,
    headline=excluded.headline,
    about=excluded.about,
    headshotUrl=excluded.headshotUrl,
    linkedinUrl=excluded.linkedinUrl,
    githubUrl=excluded.githubUrl,
    links=excluded.links,
    isOwner=excluded.isOwner,
    isQREnabled=excluded.isQREnabled,
    updatedAt=datetime('now');

INSERT INTO Profile (id, slug, name, email, phone, headline, about, headshotUrl, linkedinUrl, githubUrl, links, isOwner, isQREnabled, createdAt, updatedAt)
VALUES
  ('profile-liam-patel', 'liam-patel', 'Liam Patel', 'liam@nexaventures.com', '+1 (555) 402-1889', 'Growth marketer building data-driven campaigns.', 'I help startups expand revenue with polished digital profiles, clear CTAs, and memorable outreach.', '/images/avatar-liam.svg', 'https://linkedin.com/in/liam-patel', 'https://github.com/liam-patel', '{"label":"Book time","url":"https://calendly.com/liam-patel"}', 0, 1, datetime('now'), datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    name=excluded.name,
    email=excluded.email,
    phone=excluded.phone,
    headline=excluded.headline,
    about=excluded.about,
    headshotUrl=excluded.headshotUrl,
    linkedinUrl=excluded.linkedinUrl,
    githubUrl=excluded.githubUrl,
    links=excluded.links,
    isOwner=excluded.isOwner,
    isQREnabled=excluded.isQREnabled,
    updatedAt=datetime('now');

INSERT INTO Profile (id, slug, name, email, phone, headline, about, headshotUrl, linkedinUrl, githubUrl, links, isOwner, isQREnabled, createdAt, updatedAt)
VALUES
  ('profile-sofia-gomez', 'sofia-gomez', 'Sofia Gomez', 'sofia@pulseanalytics.com', '+1 (555) 624-7083', 'Data scientist turning analytics into action.', 'I translate complex data into compelling stories and make every profile feel like the start of a meaningful connection.', '/images/avatar-sofia.svg', 'https://linkedin.com/in/sofia-gomez', 'https://github.com/sofia-gomez', '{"label":"Speaker Reel","url":"https://sofiagomez.com/speaking"}', 0, 1, datetime('now'), datetime('now'))
  ON CONFLICT(slug) DO UPDATE SET
    name=excluded.name,
    email=excluded.email,
    phone=excluded.phone,
    headline=excluded.headline,
    about=excluded.about,
    headshotUrl=excluded.headshotUrl,
    linkedinUrl=excluded.linkedinUrl,
    githubUrl=excluded.githubUrl,
    links=excluded.links,
    isOwner=excluded.isOwner,
    isQREnabled=excluded.isQREnabled,
    updatedAt=datetime('now');

INSERT INTO User (id, username, email, emailVerified, isAdmin, passwordHash, resetToken, resetTokenExpiry, createdAt)
VALUES
  ('user-jordan', 'jordan', 'jordan@example.com', 1, 0, '${defaultPasswordHash}', NULL, NULL, datetime('now'))
  ON CONFLICT(username) DO UPDATE SET
    email=excluded.email,
    emailVerified=excluded.emailVerified,
    isAdmin=excluded.isAdmin,
    passwordHash=excluded.passwordHash,
    resetToken=excluded.resetToken,
    resetTokenExpiry=excluded.resetTokenExpiry;

INSERT INTO User (id, username, email, emailVerified, isAdmin, passwordHash, resetToken, resetTokenExpiry, createdAt)
VALUES
  ('user-taylor', 'taylor', 'taylor@example.com', 1, 0, '${defaultPasswordHash}', NULL, NULL, datetime('now'))
  ON CONFLICT(username) DO UPDATE SET
    email=excluded.email,
    emailVerified=excluded.emailVerified,
    isAdmin=excluded.isAdmin,
    passwordHash=excluded.passwordHash,
    resetToken=excluded.resetToken,
    resetTokenExpiry=excluded.resetTokenExpiry;
`;

execSync("sqlite3 prisma/dev.db", { input: sql, stdio: ["pipe", "pipe", "inherit"] });
console.log("Seed complete: dummy profiles added or updated.");

require("dotenv").config();

function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;

  let url = raw.trim().replace(/^['"]|['"]$/g, "");

  // Neon serverless driver is more reliable without channel binding.
  url = url
    .replace(/([?&])channel_binding=require&?/i, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");

  return url;
}

module.exports = { getDatabaseUrl };

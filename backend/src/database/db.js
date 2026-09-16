const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const schema = require("./schema");
const { getDatabaseUrl } = require("./config");

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.warn("DATABASE_URL is not set. Database features will fail.");
}

const sql = neon(databaseUrl || "postgresql://invalid");
const db = drizzle(sql, { schema });

module.exports = { db, sql };

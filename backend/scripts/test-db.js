require("dotenv").config();
const { getDatabaseUrl } = require("../src/database/config");
const { neon } = require("@neondatabase/serverless");

async function main() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  const sql = neon(url);
  const result = await sql`SELECT 1 AS ok`;
  console.log("Database connection OK:", result);
}

main().catch((error) => {
  console.error("Database connection failed:", error.message);
  process.exit(1);
});

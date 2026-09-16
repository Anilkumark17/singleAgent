require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const { getDatabaseUrl } = require("../src/database/config");

async function tryConnect(label, url) {
  try {
    const sql = neon(url);
    await sql`SELECT 1 AS ok`;
    console.log(`${label}: OK`);
    return true;
  } catch (error) {
    console.log(`${label}: ${error.message}`);
    return false;
  }
}

async function main() {
  const pooled = getDatabaseUrl();
  if (!pooled) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  const direct = pooled.replace("-pooler", "");

  console.log("Testing Neon connection variants...");
  const pooledOk = await tryConnect("Pooled URL", pooled);
  if (pooledOk) return;

  await tryConnect("Direct URL", direct);
}

main();

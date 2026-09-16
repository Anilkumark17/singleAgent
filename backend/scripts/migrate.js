require("dotenv").config();
const { sql } = require("../src/database/db");
const { runMigrations } = require("../src/database/migrations");

runMigrations(sql)
  .then(() => {
    console.log("Migrations completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
  });

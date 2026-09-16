const express = require("express");
const cors = require("cors");
require("dotenv").config();

const langchainRoutes = require("./src/Langchain-service/langchain.route");
const resumeRoutes = require("./src/resume-service/resume.route");

const authRoutes = require("./src/auth-service/auth.route");
const { sql } = require("./src/database/db");
const { getDatabaseUrl } = require("./src/database/config");
const { runMigrations } = require("./src/database/migrations");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());



let isDatabaseReady = false;

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: isDatabaseReady ? "connected" : "unavailable",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/langchain", langchainRoutes);
app.use("/api/resumes", resumeRoutes);

const initDatabase = async () => {
  await runMigrations(sql);
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

if (!getDatabaseUrl()) {
  console.error("DATABASE_URL is missing in backend/.env");
} else {
  initDatabase()
    .then(() => {
      isDatabaseReady = true;
      console.log("Database initialized");
    })
    .catch((error) => {
      console.error("Failed to initialize database:", error.message);
      console.error(
        "Neon rejected the credentials. In Neon Console -> Connection Details, copy a new pooled connection string into DATABASE_URL."
      );
    });
}

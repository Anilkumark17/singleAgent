const express = require("express");
const { authenticate } = require("../auth-service/auth.middleware");
const { analysisRateLimit } = require("../Langchain-service/middleware/analysisRateLimit");
const {
  listResumes,
  createResume,
  updateResume,
  deleteResume,
  analyzeResume,
  matchResumeJob,
  listMatches,
} = require("./resume.controller");

const router = express.Router();

router.get("/", authenticate, listResumes);
router.post("/", authenticate, createResume);
router.put("/:id", authenticate, updateResume);
router.delete("/:id", authenticate, deleteResume);
router.post("/:id/analyze", authenticate, analysisRateLimit, analyzeResume);
router.post("/match", authenticate, analysisRateLimit, matchResumeJob);
router.get("/matches/history", authenticate, listMatches);

module.exports = router;

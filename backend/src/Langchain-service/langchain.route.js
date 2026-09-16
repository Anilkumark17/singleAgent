const express = require("express");
const { detectJob, getAnalysisHistory } = require("./langchain.controller");
const { authenticate } = require("../auth-service/auth.middleware");
const { analysisRateLimit } = require("./middleware/analysisRateLimit");

const router = express.Router();

router.post("/detect", authenticate, analysisRateLimit, detectJob);
router.post("/search", authenticate, analysisRateLimit, detectJob);
router.get("/history", authenticate, getAnalysisHistory);

module.exports = router;

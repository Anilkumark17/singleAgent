const { detectFakeJob } = require("./services/jobDetectionService");
const jobAnalysisRepository = require("../repositories/jobAnalysis.repository");

async function detectJob(req, res) {
  try {
    const { query, jobDescription } = req.body;
    const description = (jobDescription || query || "").trim();

    if (!description) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    if (description.length > 12000) {
      return res.status(400).json({
        error: "Job description is too long (max 12,000 characters)",
      });
    }

    const analysis = await detectFakeJob(description);

    let savedAnalysisId = null;
    if (req.user?.id) {
      const saved = await jobAnalysisRepository.create({
        userId: req.user.id,
        report: analysis.report,
        heuristics: analysis.heuristics,
        sources: analysis.sources,
        agent: analysis.agent,
      });
      savedAnalysisId = saved.id;
    }

    res.json({
      ...analysis,
      savedAnalysisId,
    });
  } catch (err) {
    console.error("[detectJob]", err);
    res.status(err.statusCode || 500).json({
      error: err.message || "Job analysis failed",
    });
  }
}

async function getAnalysisHistory(req, res) {
  try {
    const history = await jobAnalysisRepository.findRecentByUserId(req.user.id, 10);
    res.json({ history });
  } catch (err) {
    console.error("[getAnalysisHistory]", err);
    res.status(500).json({
      error: "Failed to fetch analysis history",
    });
  }
}

module.exports = { detectJob, getAnalysisHistory };

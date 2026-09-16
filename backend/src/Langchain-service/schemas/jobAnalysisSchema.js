const { z } = require("zod");

const JobAnalysisReportSchema = z.object({
  verdict: z.enum(["legitimate", "suspicious", "likely_scam"]),
  riskLevel: z.enum(["Low", "Medium", "High"]),
  confidence: z.number().min(0).max(100),
  companyName: z.string(),
  summary: z.string(),
  redFlags: z.array(z.string()),
  positiveSignals: z.array(z.string()),
  recommendations: z.array(z.string()),
});

module.exports = { JobAnalysisReportSchema };

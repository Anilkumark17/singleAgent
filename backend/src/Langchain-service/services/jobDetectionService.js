const { analyzeJobHeuristics } = require("./heuristicsService");
const { getGroqModel, getGroqAgentModel, getJobDetectionMode } = require("../config/llmConfig");
const { runJobFraudPipeline } = require("./jobFraudPipeline");

let agentModulePromise;

function loadAgentModule() {
  if (!agentModulePromise) {
    agentModulePromise = import("../agents/jobFraudAgent.mjs");
  }
  return agentModulePromise;
}

function assertConfig() {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("Groq API key is not configured");
    error.statusCode = 503;
    throw error;
  }

  if (!process.env.TAVILY_API_KEY) {
    const error = new Error("Tavily API key is not configured");
    error.statusCode = 503;
    throw error;
  }
}

async function detectFakeJob(jobDescription) {
  assertConfig();

  const trimmedDescription = jobDescription.trim();
  const heuristics = analyzeJobHeuristics(trimmedDescription);
  const mode = getJobDetectionMode();

  const startedAt = Date.now();
  let agentResult;
  let pipelineName;

  if (mode === "agent") {
    const { runJobFraudAgent } = await loadAgentModule();
    agentResult = await runJobFraudAgent({
      jobDescription: trimmedDescription,
      heuristics,
    });
    pipelineName = "langgraph-react-agent";
  } else {
    agentResult = await runJobFraudPipeline({
      jobDescription: trimmedDescription,
      heuristics,
    });
    pipelineName = "optimized-pipeline";
  }

  const durationMs = Date.now() - startedAt;

  return {
    report: agentResult.report,
    heuristics,
    sources: agentResult.sources,
    agent: {
      name: "job_fraud_investigator",
      steps: agentResult.agentSteps,
      messageCount: agentResult.rawMessageCount,
      durationMs,
    },
    metadata: {
      analyzedAt: new Date().toISOString(),
      model: mode === "agent" ? getGroqAgentModel() : getGroqModel(),
      pipeline: pipelineName,
    },
  };
}

module.exports = { detectFakeJob };

// openai/gpt-oss-20b: best balance on Groq free tier for tool calling + structured output.
// groq/compound has higher TPM but does not support tool calling on the API.
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

function getGroqModel() {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

function getGroqAgentModel() {
  return process.env.GROQ_AGENT_MODEL || getGroqModel();
}

function getJobDetectionMode() {
  return process.env.GROQ_JOB_MODE || "pipeline";
}

module.exports = {
  getGroqModel,
  getGroqAgentModel,
  getJobDetectionMode,
  DEFAULT_GROQ_MODEL,
};

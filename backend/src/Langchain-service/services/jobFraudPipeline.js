const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");
const { tavily } = require("@tavily/core");
const { getGroqModel } = require("../config/llmConfig");
const { invokeWithRetry } = require("./groqRetry");
const { JobAnalysisReportSchema } = require("../schemas/jobAnalysisSchema");

let llm;

function getLlm() {
  if (!llm) {
    llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: getGroqModel(),
      temperature: 0,
    });
  }
  return llm;
}

function compactResults(results = []) {
  return results.slice(0, 3).map((item) => ({
    title: item.title,
    url: item.url,
    content: String(item.content || "").slice(0, 280),
  }));
}

async function runJobFraudPipeline({ jobDescription, heuristics }) {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const steps = [];
  const sources = [];
  const seenUrls = new Set();

  const extractPrompt = ChatPromptTemplate.fromTemplate(
    "Extract ONLY the company name from this job description. If unknown, return Unknown.\n\n{jobDescription}"
  );

  const extractResult = await invokeWithRetry(() =>
    extractPrompt.pipe(getLlm()).invoke({
      jobDescription: jobDescription.slice(0, 6000),
    })
  );

  const companyName = String(extractResult.content).trim() || "Unknown";
  steps.push({ type: "analysis", tool: "extract_company", input: { companyName } });

  const queries = [
    `${companyName} company official website careers`,
    `${companyName} job scam OR fake job posting`,
  ];

  const searchResponses = await Promise.all(
    queries.map(async (query) => {
      steps.push({ type: "tool_call", tool: "web_search", input: { query } });
      const response = await tvly.search(query, {
        searchDepth: "basic",
        maxResults: 3,
        includeAnswer: true,
      });
      steps.push({ type: "tool_result", tool: "web_search" });

      for (const result of response.results || []) {
        if (!result.url || seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        sources.push({
          title: result.title,
          url: result.url,
          content: result.content,
          publishedDate: result.publishedDate,
        });
      }

      return {
        query,
        answer: response.answer,
        results: compactResults(response.results),
      };
    })
  );

  const verifyPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a job fraud investigator. Use evidence only. Return structured output.",
    ],
    [
      "human",
      `Job Description:
{jobDescription}

Company:
{company}

Heuristics:
{heuristics}

Web Evidence:
{searchEvidence}

Produce a fraud risk assessment.`,
    ],
  ]);

  const structuredLlm = getLlm().withStructuredOutput(JobAnalysisReportSchema);

  const report = await invokeWithRetry(() =>
    verifyPrompt.pipe(structuredLlm).invoke({
      jobDescription: jobDescription.slice(0, 6000),
      company: companyName,
      heuristics: JSON.stringify(heuristics),
      searchEvidence: JSON.stringify(searchResponses),
    })
  );

  steps.push({ type: "analysis", tool: "final_verdict" });

  return {
    report,
    agentSteps: steps,
    sources,
    rawMessageCount: steps.length,
  };
}

module.exports = { runJobFraudPipeline };

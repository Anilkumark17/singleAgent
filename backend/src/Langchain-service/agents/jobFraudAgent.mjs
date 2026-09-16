import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { tavily } from "@tavily/core";

const GROQ_MODEL =
  process.env.GROQ_AGENT_MODEL ||
  process.env.GROQ_MODEL ||
  "openai/gpt-oss-20b";

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

const SYSTEM_PROMPT = `You are a senior job fraud investigator agent.

Your job is to determine whether a job posting is legitimate using evidence from tools.

Rules:
- Always run at least two web_search calls with different queries (company legitimacy + careers/job listing verification).
- Cross-check company name, careers page, recruiter identity, and compensation claims.
- Treat free personal email domains, upfront payment requests, and vague company details as strong red flags.
- Never claim certainty without citing web evidence or heuristic signals.
- Produce a final structured assessment only after tool research is complete.`;

function extractSourcesFromMessages(messages) {
  const sources = [];
  const seen = new Set();

  for (const message of messages) {
    if (message?.name !== "web_search") continue;
    try {
      const payload = JSON.parse(String(message.content));
      for (const result of payload.results || []) {
        if (!result?.url || seen.has(result.url)) continue;
        seen.add(result.url);
        sources.push({
          title: result.title,
          url: result.url,
          content: result.content,
          publishedDate: result.publishedDate,
        });
      }
    } catch {
      // Ignore malformed tool payloads.
    }
  }

  return sources;
}

function extractAgentSteps(messages) {
  const steps = [];

  for (const message of messages) {
    if (message?.tool_calls?.length) {
      for (const call of message.tool_calls) {
        steps.push({
          type: "tool_call",
          tool: call.name,
          input: call.args,
        });
      }
    }

    if (message?.name) {
      steps.push({
        type: "tool_result",
        tool: message.name,
      });
    }
  }

  return steps;
}

export async function runJobFraudAgent({ jobDescription, heuristics }) {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: GROQ_MODEL,
    temperature: 0,
  });

  const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  const webSearch = tool(
    async ({ query }) => {
      const response = await tvly.search(query, {
        searchDepth: "advanced",
        maxResults: 5,
        includeAnswer: true,
      });

      return JSON.stringify({
        query,
        answer: response.answer,
        results: response.results,
      });
    },
    {
      name: "web_search",
      description:
        "Search the public web for company legitimacy, careers pages, scam reports, and job listing verification.",
      schema: z.object({
        query: z.string().describe("Focused search query for verification."),
      }),
    }
  );

  const agent = createReactAgent({
    llm,
    tools: [webSearch],
    prompt: SYSTEM_PROMPT,
    responseFormat: JobAnalysisReportSchema,
    name: "job_fraud_investigator",
  });

  const userPrompt = `Investigate this job posting for fraud risk.

Job Description:
${jobDescription}

Deterministic Heuristic Scan:
${JSON.stringify(heuristics, null, 2)}

Use tools to verify the company and posting before your final verdict.`;

  const result = await agent.invoke(
    {
      messages: [new HumanMessage({ content: userPrompt })],
    },
    { recursionLimit: 8 }
  );

  return {
    report: result.structuredResponse,
    agentSteps: extractAgentSteps(result.messages || []),
    sources: extractSourcesFromMessages(result.messages || []),
    rawMessageCount: result.messages?.length || 0,
  };
}

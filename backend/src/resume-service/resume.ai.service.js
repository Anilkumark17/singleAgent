const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");
const { getGroqModel } = require("../Langchain-service/config/llmConfig");
const { invokeWithRetry } = require("../Langchain-service/services/groqRetry");

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

const ResumeAnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  headline: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  improvements: z.array(z.string()),
  keywordsFound: z.array(z.string()),
  suggestedKeywords: z.array(z.string()),
});

const ResumeJobMatchSchema = z.object({
  fitScore: z.number().min(0).max(100),
  applyRecommendation: z.enum([
    "strong_apply",
    "apply_with_caution",
    "do_not_apply",
  ]),
  summary: z.string(),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  resumeEdits: z.array(z.string()),
  jobRiskNote: z.string(),
});

async function analyzeResumeContent(resumeContent) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are an expert resume coach and ATS reviewer. Provide practical, specific feedback.",
    ],
    [
      "human",
      `Analyze this resume for ATS readiness and job-search quality.

Resume:
{resumeContent}`,
    ],
  ]);

  const chain = prompt.pipe(getLlm().withStructuredOutput(ResumeAnalysisSchema));
  return invokeWithRetry(() =>
    chain.invoke({ resumeContent: resumeContent.trim().slice(0, 8000) })
  );
}

async function matchResumeToJob({ resumeContent, jobDescription }) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a career coach helping candidates avoid scams and apply strategically.",
    ],
    [
      "human",
      `Compare this resume against the job description.

Return a fit score and whether the candidate should apply.
Also include a short note if the job posting itself looks risky or inconsistent.

Resume:
{resumeContent}

Job Description:
{jobDescription}`,
    ],
  ]);

  const chain = prompt.pipe(getLlm().withStructuredOutput(ResumeJobMatchSchema));
  return invokeWithRetry(() =>
    chain.invoke({
      resumeContent: resumeContent.trim().slice(0, 8000),
      jobDescription: jobDescription.trim().slice(0, 8000),
    })
  );
}

module.exports = { analyzeResumeContent, matchResumeToJob };

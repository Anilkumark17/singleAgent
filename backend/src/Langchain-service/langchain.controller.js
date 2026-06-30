const { tavily } = require("@tavily/core");
const { ChatGroq } = require("@langchain/groq");
const {
  ChatPromptTemplate,
} = require("@langchain/core/prompts");

let llm;
let tvly;

function getLlm() {
  if (!llm) {
    llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
  }
  return llm;
}

function getTavilyClient() {
  if (!tvly) {
    tvly = tavily({
      apiKey: process.env.TAVILY_API_KEY,
    });
  }
  return tvly;
}
const tavilySearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "Groq API key is not configured",
      });
    }

    if (!process.env.TAVILY_API_KEY) {
      return res.status(503).json({
        error: "Tavily API key is not configured",
      });
    }

    const jobDescription = query.trim();

    // STEP 1: Extract company name
    const extractPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert recruiter.

Extract ONLY the company name from the following job description.
If no company name is found, return "Unknown".

Job Description:
{jobDescription}

Return only the company name.
`);

    const extractChain = extractPrompt.pipe(getLlm());

    const extractResult = await extractChain.invoke({
      jobDescription,
    });

    const companyName = String(extractResult.content).trim();

    // STEP 2: Tavily Search
    const searchResponse = await getTavilyClient().search(
      `${companyName} company official website careers job posting`,
      {
        searchDepth: "advanced",
        maxResults: 5,
        includeAnswer: true,
      }
    );

    // STEP 3: Verify job legitimacy
    const verifyPrompt = ChatPromptTemplate.fromTemplate(`
You are an AI job fraud detection expert.

Job Description:
{jobDescription}

Extracted Company:
{company}

Tavily Search Results:
{searchResults}

Analyze whether this job description is legitimate.

Return in this format:

Risk: Low | Medium | High

Reason:
- ...

Red Flags:
- ...

Confidence Score:
0-100
`);

    const verifyChain = verifyPrompt.pipe(getLlm());

    const finalResult = await verifyChain.invoke({
      jobDescription,
      company: companyName,
      searchResults: JSON.stringify(searchResponse.results, null, 2),
    });

    res.json({
      company: companyName,
      tavilyAnswer: searchResponse.answer,
      results: searchResponse.results,
      analysis: String(finalResult.content).trim(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Job analysis failed",
    });
  }
};

module.exports = { tavilySearch };
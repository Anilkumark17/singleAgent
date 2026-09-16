const resumeRepository = require("../repositories/resume.repository");
const {
  analyzeResumeContent,
  matchResumeToJob,
} = require("./resume.ai.service");
const { getDatabaseErrorMessage } = require("../utils/dbErrors");

function handleError(res, error, fallbackMessage) {
  return res.status(error.statusCode || 500).json({
    error: getDatabaseErrorMessage(error) || error.message || fallbackMessage,
  });
}

async function listResumes(req, res) {
  try {
    const resumes = await resumeRepository.findByUserId(req.user.id);
    res.json({ resumes });
  } catch (error) {
    handleError(res, error, "Failed to fetch resumes");
  }
}

async function createResume(req, res) {
  try {
    const { title, content, isPrimary } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Resume content is required" });
    }

    const resume = await resumeRepository.create({
      userId: req.user.id,
      title: title?.trim() || "My Resume",
      content: content.trim(),
      isPrimary: Boolean(isPrimary),
    });

    res.status(201).json({ resume });
  } catch (error) {
    handleError(res, error, "Failed to create resume");
  }
}

async function updateResume(req, res) {
  try {
    const { title, content, isPrimary } = req.body;
    const resume = await resumeRepository.update({
      id: Number(req.params.id),
      userId: req.user.id,
      title: title?.trim(),
      content: content?.trim(),
      isPrimary:
        typeof isPrimary === "boolean" ? isPrimary : undefined,
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.json({ resume });
  } catch (error) {
    handleError(res, error, "Failed to update resume");
  }
}

async function deleteResume(req, res) {
  try {
    const deleted = await resumeRepository.remove(
      Number(req.params.id),
      req.user.id
    );

    if (!deleted) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.json({ message: "Resume deleted" });
  } catch (error) {
    handleError(res, error, "Failed to delete resume");
  }
}

async function analyzeResume(req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "Groq API key is not configured" });
    }

    const resume = await resumeRepository.findByIdForUser(
      Number(req.params.id),
      req.user.id
    );

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const analysis = await analyzeResumeContent(resume.content);
    const updated = await resumeRepository.saveAnalysis({
      id: resume.id,
      userId: req.user.id,
      analysis,
    });

    res.json({ analysis, resume: updated });
  } catch (error) {
    handleError(res, error, "Failed to analyze resume");
  }
}

async function matchResumeJob(req, res) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "Groq API key is not configured" });
    }

    const { resumeId, jobDescription, resumeContent } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }

    let content = resumeContent?.trim();
    let resume = null;

    if (resumeId) {
      resume = await resumeRepository.findByIdForUser(
        Number(resumeId),
        req.user.id
      );
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }
      content = resume.content;
    }

    if (!content) {
      return res.status(400).json({
        error: "Provide resumeId or resumeContent",
      });
    }

    const report = await matchResumeToJob({
      resumeContent: content,
      jobDescription: jobDescription.trim(),
    });

    await resumeRepository.saveMatch({
      userId: req.user.id,
      resumeId: resume?.id ?? null,
      jobDescription: jobDescription.trim(),
      report,
    });

    res.json({ report });
  } catch (error) {
    handleError(res, error, "Failed to match resume to job");
  }
}

async function listMatches(req, res) {
  try {
    const matches = await resumeRepository.findMatchesByUserId(req.user.id, 10);
    res.json({ matches });
  } catch (error) {
    handleError(res, error, "Failed to fetch match history");
  }
}

module.exports = {
  listResumes,
  createResume,
  updateResume,
  deleteResume,
  analyzeResume,
  matchResumeJob,
  listMatches,
};

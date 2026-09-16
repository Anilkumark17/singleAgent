const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
  "aol.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
]);

const SCAM_PHRASES = [
  "wire transfer",
  "western union",
  "pay for training",
  "registration fee",
  "equipment fee",
  "send money",
  "crypto wallet",
  "telegram only",
  "whatsapp only",
  "work from phone",
  "no experience required",
  "earn \\$\\d{3,} per day",
  "immediate start",
  "personal bank account",
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s)]+/gi;

function analyzeJobHeuristics(jobDescription) {
  const text = jobDescription.trim();
  const lower = text.toLowerCase();
  const signals = [];
  let riskScore = 0;

  const emails = [...new Set(text.match(EMAIL_REGEX) || [])];
  const urls = [...new Set(text.match(URL_REGEX) || [])];

  for (const email of emails) {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
      signals.push({
        type: "free_email_contact",
        severity: "high",
        detail: `Recruiter contact uses a personal email (${email}).`,
      });
      riskScore += 25;
    }
  }

  for (const phrase of SCAM_PHRASES) {
    const pattern = new RegExp(phrase, "i");
    if (pattern.test(text)) {
      signals.push({
        type: "scam_phrase",
        severity: "medium",
        detail: `Suspicious phrase detected: "${phrase.replace(/\\/g, "")}".`,
      });
      riskScore += 12;
    }
  }

  if (emails.length === 0) {
    signals.push({
      type: "missing_contact",
      severity: "low",
      detail: "No recruiter email found in the posting.",
    });
    riskScore += 5;
  }

  if (urls.length === 0) {
    signals.push({
      type: "missing_urls",
      severity: "low",
      detail: "No application or company URLs found.",
    });
    riskScore += 5;
  }

  if (text.length < 120) {
    signals.push({
      type: "short_posting",
      severity: "medium",
      detail: "Job description is unusually short for a legitimate listing.",
    });
    riskScore += 10;
  }

  const riskLevel =
    riskScore >= 50 ? "High" : riskScore >= 25 ? "Medium" : "Low";

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    emails,
    urls,
    signals,
  };
}

module.exports = { analyzeJobHeuristics };

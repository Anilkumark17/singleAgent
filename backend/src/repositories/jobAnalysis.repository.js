const { sql } = require("../database/db");

async function create({ userId, report, heuristics, sources, agent }) {
  const [row] = await sql`
    INSERT INTO job_analyses (
      user_id,
      company_name,
      verdict,
      risk_level,
      confidence,
      report,
      heuristics,
      sources,
      agent_trace
    )
    VALUES (
      ${userId},
      ${report.companyName},
      ${report.verdict},
      ${report.riskLevel},
      ${report.confidence},
      ${report},
      ${heuristics},
      ${sources},
      ${agent}
    )
    RETURNING id, created_at
  `;

  return row;
}

async function findRecentByUserId(userId, limit = 10) {
  return sql`
    SELECT
      id,
      company_name,
      verdict,
      risk_level,
      confidence,
      report,
      created_at
    FROM job_analyses
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

module.exports = { create, findRecentByUserId };

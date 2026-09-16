const { sql } = require("../database/db");

async function create({ userId, title, content, isPrimary = false }) {
  if (isPrimary) {
    await sql`
      UPDATE resumes SET is_primary = FALSE WHERE user_id = ${userId}
    `;
  }

  const [row] = await sql`
    INSERT INTO resumes (user_id, title, content, is_primary)
    VALUES (${userId}, ${title}, ${content}, ${isPrimary})
    RETURNING id, user_id, title, content, is_primary, last_analysis, created_at, updated_at
  `;

  return row;
}

async function findByUserId(userId) {
  return sql`
    SELECT id, user_id, title, content, is_primary, last_analysis, created_at, updated_at
    FROM resumes
    WHERE user_id = ${userId}
    ORDER BY is_primary DESC, updated_at DESC
  `;
}

async function findByIdForUser(id, userId) {
  const [row] = await sql`
    SELECT id, user_id, title, content, is_primary, last_analysis, created_at, updated_at
    FROM resumes
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;

  return row ?? null;
}

async function update({ id, userId, title, content, isPrimary }) {
  if (isPrimary) {
    await sql`
      UPDATE resumes SET is_primary = FALSE WHERE user_id = ${userId}
    `;
  }

  const [row] = await sql`
    UPDATE resumes
    SET
      title = COALESCE(${title}, title),
      content = COALESCE(${content}, content),
      is_primary = COALESCE(${isPrimary}, is_primary),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, title, content, is_primary, last_analysis, created_at, updated_at
  `;

  return row ?? null;
}

async function saveAnalysis({ id, userId, analysis }) {
  const [row] = await sql`
    UPDATE resumes
    SET last_analysis = ${analysis}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, title, content, is_primary, last_analysis, created_at, updated_at
  `;

  return row ?? null;
}

async function remove(id, userId) {
  const [row] = await sql`
    DELETE FROM resumes
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  return row ?? null;
}

async function saveMatch({ userId, resumeId, jobDescription, report }) {
  const [row] = await sql`
    INSERT INTO resume_job_matches (
      user_id,
      resume_id,
      job_description,
      fit_score,
      apply_recommendation,
      report
    )
    VALUES (
      ${userId},
      ${resumeId},
      ${jobDescription},
      ${report.fitScore},
      ${report.applyRecommendation},
      ${report}
    )
    RETURNING id, created_at
  `;

  return row;
}

async function findMatchesByUserId(userId, limit = 10) {
  return sql`
    SELECT id, resume_id, fit_score, apply_recommendation, report, created_at
    FROM resume_job_matches
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

module.exports = {
  create,
  findByUserId,
  findByIdForUser,
  update,
  saveAnalysis,
  remove,
  saveMatch,
  findMatchesByUserId,
};

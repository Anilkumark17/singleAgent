async function runMigrations(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS job_analyses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      verdict VARCHAR(50) NOT NULL,
      risk_level VARCHAR(20) NOT NULL,
      confidence INTEGER NOT NULL,
      report JSONB NOT NULL,
      heuristics JSONB,
      sources JSONB,
      agent_trace JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
      content TEXT NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      last_analysis JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS resume_job_matches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
      job_description TEXT NOT NULL,
      fit_score INTEGER NOT NULL,
      apply_recommendation VARCHAR(50) NOT NULL,
      report JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_resume_job_matches_user_id ON resume_job_matches(user_id)
  `;
}

module.exports = { runMigrations };

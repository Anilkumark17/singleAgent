function getDatabaseErrorMessage(error) {
  const causeMessage =
    error?.cause?.message ||
    error?.cause?.sourceError?.message ||
    error?.message ||
    "";

  if (causeMessage.includes("password authentication failed")) {
    return "Database authentication failed. Copy a fresh connection string from Neon and update DATABASE_URL in backend/.env.";
  }

  if (causeMessage.includes('relation "users" does not exist')) {
    return "Database tables are missing. Restart backend after fixing DATABASE_URL so migrations can run.";
  }

  if (causeMessage.includes("DATABASE_URL")) {
    return "Database is not configured. Set DATABASE_URL in backend/.env.";
  }

  if (error?.message?.startsWith("Failed query:")) {
    return getDatabaseErrorMessage(error.cause || error);
  }

  return causeMessage || "Database request failed";
}

module.exports = { getDatabaseErrorMessage };

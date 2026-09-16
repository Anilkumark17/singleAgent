function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  const message = error?.message || "";
  return message.includes("429") || message.includes("rate_limit");
}

async function invokeWithRetry(task, { retries = 2, delayMs = 18000 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === retries) {
        throw error;
      }
      await sleep(delayMs);
    }
  }

  throw lastError;
}

module.exports = { invokeWithRetry };

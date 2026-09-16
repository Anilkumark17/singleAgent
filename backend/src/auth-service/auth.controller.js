const authService = require("./auth.service");
const { getDatabaseErrorMessage } = require("../utils/dbErrors");

function getAuthErrorMessage(error) {
  return getDatabaseErrorMessage(error) || "Authentication request failed";
}

function getAuthErrorStatus(error) {
  const message = getAuthErrorMessage(error);
  if (
    message.includes("authentication failed") ||
    message.includes("not configured") ||
    message.includes("tables are missing")
  ) {
    return 503;
  }

  return error.statusCode || 500;
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const { user, token } = await authService.register({ name, email, password });
    return res.status(201).json({ message: "Registration successful", user, token });
  } catch (error) {
    return res.status(getAuthErrorStatus(error)).json({
      message: getAuthErrorMessage(error) || "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { user, token } = await authService.login({ email, password });
    return res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    return res.status(getAuthErrorStatus(error)).json({
      message: getAuthErrorMessage(error) || "Login failed",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch profile",
    });
  }
};

module.exports = { register, login, getMe };

const authService = require("./auth.service");

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
    return res.status(error.statusCode || 500).json({
      message: error.message || "Registration failed",
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
    return res.status(error.statusCode || 500).json({
      message: error.message || "Login failed",
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

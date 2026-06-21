const express = require("express");
const { register, login, getMe } = require("./auth.controller");
const { authenticate, authorize } = require("./auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/admin", authenticate, authorize("admin"), (_req, res) => {
  res.status(200).json({ message: "Admin access granted" });
});

module.exports = router;

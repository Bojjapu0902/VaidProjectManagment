const express = require("express");
const router = express.Router();
const {
  register, login, logout, getMe,
  refreshToken, forgotPassword, resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;

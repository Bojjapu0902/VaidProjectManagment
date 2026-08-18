const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendEmail } = require("../services/email.service");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, tokenVersion: user.refreshTokenVersion || 0 }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, tokenVersion: user.refreshTokenVersion || 0 }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Only an authenticated admin may create non-client roles; an
    // unauthenticated / anonymous register always results in a client
    // account (self-signup is for clients only, per the spec's RBAC model).
    const requesterRole = req.user?.role;
    const allowedRole = requesterRole === "admin" && role ? role : "client";

    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      phone,
      company,
      avatarInitials: initials,
    });

    const tokens = issueTokens(user);
    res.status(201).json({ user: user.toSafeObject(), ...tokens });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const tokens = issueTokens(user);
    res.json({ user: user.toSafeObject(), ...tokens });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    if ((user.refreshTokenVersion || 0) !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Refresh token has been revoked" });
    }

    const tokens = issueTokens(user);
    res.json({ user: user.toSafeObject(), ...tokens });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond 200 regardless of whether the account exists, so this
    // endpoint can't be used to enumerate registered email addresses.
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your ArchPro password",
      text: `You requested a password reset. This link expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or has expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1; // invalidate old sessions
    await user.save();

    res.json({ message: "Password has been reset. Please log in with your new password." });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Bumping the refresh-token version invalidates every outstanding
    // refresh token for this user (a coarse but simple server-side revoke).
    if (req.user) {
      req.user.refreshTokenVersion = (req.user.refreshTokenVersion || 0) + 1;
      await req.user.save();
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

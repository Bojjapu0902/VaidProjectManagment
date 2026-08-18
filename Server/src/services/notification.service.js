const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIO } = require("../config/socket");
const { sendEmail } = require("./email.service");

/**
 * Creates a Notification document, pushes it over Socket.io to the
 * recipient if they're connected, and emails them if their preferences
 * allow it. This is the single place every controller should call instead
 * of writing to the Notification collection directly (spec Section 9).
 */
async function notify({ userId, projectId, type, title, message, link }) {
  if (!userId) return null;

  const notification = await Notification.create({ userId, projectId, type, title, message });

  const io = getIO();
  if (io) {
    io.to(String(userId)).emit("notification:new", {
      ...notification.toObject(),
      link,
    });
  }

  try {
    const user = await User.findById(userId);
    if (user?.notificationPreferences?.email !== false && user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        text: `${message}${link ? `\n\n${link}` : ""}`,
      });
    }
  } catch (err) {
    console.error("[notification] email dispatch failed:", err.message);
  }

  return notification;
}

/** Notify every distinct recipient in a list (dedupes falsy/duplicate ids). */
async function notifyMany(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean).map(String))];
  return Promise.all(unique.map((userId) => notify({ ...payload, userId })));
}

module.exports = { notify, notifyMany };

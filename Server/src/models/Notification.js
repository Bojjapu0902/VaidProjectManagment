const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "approval_requested",
  "approval_completed",
  "document_uploaded",
  "stage_completed",
  "deadline_reminder",
  "feedback_received",
  "team_assigned",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

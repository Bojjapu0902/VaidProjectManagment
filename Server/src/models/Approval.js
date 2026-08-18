const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    projectName: { type: String },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    documentName: { type: String, required: true },
    stageNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "internal_review", "approved", "rejected", "overdue"],
      default: "pending",
    },
    urgency: { type: String, enum: ["neutral", "warning", "danger", "client-action"], default: "neutral" },
    dueIn: { type: String },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: { type: String },
    reviewedAt: { type: Date },
    revisionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Approval", approvalSchema);

const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: true }
);

const stageSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    completedAt: { type: Date },
    notes: { type: String },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { _id: false }
);

const substageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const lifecycleStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    substages: { type: [substageSchema], default: [] },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectCode: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Residential", "Commercial", "Civic", "Industrial", "Mixed-Use"], required: true },
    location: { type: String, required: true },
    description: { type: String },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientName: { type: String },
    currentStage: { type: Number, min: 1, max: 8, default: 1 },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    stages: { type: [stageSchema], default: [] },
    lifecycle: { type: [lifecycleStageSchema], default: [] },
    team: { type: [teamMemberSchema], default: [] },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    timeline: {
      startDate: { type: Date },
      expectedEndDate: { type: Date },
      actualEndDate: { type: Date },
    },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalReview: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      checklist: { type: [String], default: [] },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
);

projectSchema.pre("save", function (next) {
  if (!this.projectCode) {
    this.projectCode = `ARC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);

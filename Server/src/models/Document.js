const mongoose = require("mongoose");

const versionEntrySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    filePath: { type: String },
    fileSize: { type: String },
    fileType: { type: String },
    uploadedBy: { type: String },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    stageNumber: { type: Number, min: 1, max: 8, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, enum: ["drawing", "report", "photo", "contract", "other"], default: "other" },
    fileType: { type: String },
    fileSize: { type: String },
    filePath: { type: String },
    version: { type: Number, default: 1 },
    previousVersions: { type: [versionEntrySchema], default: [] },
    isClientVisible: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    uploadedBy: { type: String },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);

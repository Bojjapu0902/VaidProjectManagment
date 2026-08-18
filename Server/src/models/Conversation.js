const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }, // the project-wide "General" group, auto-created
    participants: { type: [participantSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((p) => p.userId.toString() === userId.toString());
};

module.exports = mongoose.model("Conversation", conversationSchema);

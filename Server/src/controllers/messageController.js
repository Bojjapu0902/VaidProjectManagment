const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { notifyMany } = require("../services/notification.service");

const canAccessConversation = (conversation, user) =>
  ["admin", "project_manager"].includes(user.role) || conversation.hasParticipant(user._id);

// GET /api/v1/conversations/:convId/messages
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/conversations/:convId/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const msg = await Message.create({
      conversationId: conversation._id,
      projectId: conversation.projectId,
      senderId: req.user._id,
      senderName: req.user.name,
      message: message.trim(),
    });

    conversation.lastMessageAt = msg.createdAt;
    await conversation.save();

    const recipients = conversation.participants
      .map((p) => p.userId)
      .filter((id) => id.toString() !== req.user._id.toString());

    await notifyMany(recipients, {
      projectId: conversation.projectId,
      type: "feedback_received",
      title: `New message in ${conversation.name}`,
      message: `${req.user.name}: ${message.trim().slice(0, 120)}`,
    });

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

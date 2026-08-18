const Conversation = require("../models/Conversation");
const Project = require("../models/Project");
const { notifyMany } = require("../services/notification.service");

const canAccessProject = (project, user) => {
  if (["admin", "project_manager"].includes(user.role)) return true;
  if (user.role === "client") return project.clientId.toString() === user._id.toString();
  return project.team.some((m) => m.userId.toString() === user._id.toString());
};

// Builds the full roster (client + team) for a project, used to seed the
// default "General" group chat the first time anyone opens Messages.
const projectRoster = async (project) => {
  const User = require("../models/User");
  const client = await User.findById(project.clientId);
  const roster = [
    ...(client ? [{ userId: client._id, name: client.name }] : []),
    ...project.team.map((m) => ({ userId: m.userId, name: m.name })),
  ];
  // De-dupe by userId in case a team member is also somehow the client record.
  const seen = new Set();
  return roster.filter((p) => {
    const key = p.userId.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// GET /api/v1/projects/:id/conversations — lists this project's group
// chats, auto-creating the project-wide "General" group on first access.
exports.getConversations = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ message: "Forbidden" });

    let conversations = await Conversation.find({ projectId: project._id }).sort({ isDefault: -1, createdAt: 1 });

    if (conversations.length === 0) {
      const roster = await projectRoster(project);
      const general = await Conversation.create({
        projectId: project._id,
        name: "General",
        isDefault: true,
        participants: roster,
        createdBy: req.user._id,
      });
      conversations = [general];
    }

    // Non-management users only see groups they're actually part of.
    const visible =
      req.user.role === "admin" || req.user.role === "project_manager"
        ? conversations
        : conversations.filter((c) => c.hasParticipant(req.user._id));

    res.json(visible);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/projects/:id/conversations — create a new named group chat
// with a chosen subset of the project's team + client.
exports.createConversation = async (req, res, next) => {
  try {
    const { name, participantIds = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Group name is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ message: "Forbidden" });

    const roster = await projectRoster(project);
    const rosterById = new Map(roster.map((p) => [p.userId.toString(), p]));

    // Only people already on the project (team or client) can be added —
    // participants is always a subset of the roster, plus the creator.
    const chosen = participantIds
      .map((id) => rosterById.get(String(id)))
      .filter(Boolean);

    const selfEntry = rosterById.get(req.user._id.toString()) || { userId: req.user._id, name: req.user.name };
    const participants = [selfEntry, ...chosen].filter(
      (p, idx, arr) => arr.findIndex((x) => x.userId.toString() === p.userId.toString()) === idx
    );

    const conversation = await Conversation.create({
      projectId: project._id,
      name: name.trim(),
      participants,
      createdBy: req.user._id,
    });

    await notifyMany(
      participants.map((p) => p.userId).filter((id) => id.toString() !== req.user._id.toString()),
      {
        projectId: project._id,
        type: "team_assigned",
        title: "Added to a new group chat",
        message: `${req.user.name} added you to "${conversation.name}" in ${project.title}.`,
      }
    );

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/conversations/:convId/participants
exports.addParticipant = async (req, res, next) => {
  try {
    const { userId, name } = req.body;
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!conversation.hasParticipant(userId)) {
      conversation.participants.push({ userId, name });
      await conversation.save();

      await notifyMany([userId], {
        projectId: conversation.projectId,
        type: "team_assigned",
        title: "Added to a group chat",
        message: `You were added to "${conversation.name}".`,
      });
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/conversations/:convId/participants/:userId
exports.removeParticipant = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.isDefault) {
      return res.status(400).json({ message: "Cannot remove members from the default General group" });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== req.params.userId
    );
    await conversation.save();
    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

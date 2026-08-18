const Project = require("../models/Project");
const User = require("../models/User");
const { notify, notifyMany } = require("../services/notification.service");

const teamUserIds = (project) => project.team.map((m) => m.userId);

exports.getProjects = async (req, res, next) => {
  try {
    const { includeArchived } = req.query;
    const filter = {};
    if (includeArchived !== "true") filter.isArchived = false;

    if (req.user.role === "client") {
      filter.clientId = req.user._id;
    } else if (["architect", "designer", "engineer"].includes(req.user.role)) {
      // Non-management team roles only see projects they're assigned to.
      filter["team.userId"] = req.user._id;
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (req.user.role === "client" && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { title, type, location, description, clientId, timeline, budget, team, lifecycle } = req.body;

    const client = await User.findById(clientId);
    const clientName = client ? client.name : req.body.clientName || "";

    const project = await Project.create({
      title,
      type,
      location,
      description,
      clientId,
      clientName,
      timeline,
      budget,
      team: Array.isArray(team) ? team : [],
      lifecycle: Array.isArray(lifecycle) ? lifecycle : [],
      currentStage: 1,
      progressPercent: 0,
      createdBy: req.user._id,
    });

    if (client) {
      await notify({
        userId: client._id,
        projectId: project._id,
        type: "stage_completed",
        title: "Your project has been created",
        message: `${project.title} (${project.projectCode}) has been set up and is now in progress.`,
      });
    }

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/projects/:id — general metadata update (title, description,
// budget, timeline). Distinct from the stage-specific PUT below.
exports.updateProject = async (req, res, next) => {
  try {
    const { title, description, location, type, budget, timeline } = req.body;
    const update = { title, description, location, type, budget, timeline };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const project = await Project.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/projects/:id — archive, never a hard delete.
exports.archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.updateStage = async (req, res, next) => {
  try {
    const { id, stageNumber } = req.params;
    const { status, notes, progressPercent } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const stageNum = Number(stageNumber);
    const existingIdx = project.stages.findIndex((s) => s.number === stageNum);

    const stageData = {
      number: stageNum,
      status: status || "in_progress",
      notes,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    };

    if (existingIdx >= 0) {
      const existing = project.stages[existingIdx].toObject();
      project.stages[existingIdx] = { ...existing, ...stageData, milestones: existing.milestones };
    } else {
      project.stages.push(stageData);
    }

    const wasCompleted = status === "completed";
    if (wasCompleted) {
      project.currentStage = Math.min(stageNum + 1, 8);
    }

    if (progressPercent !== undefined) {
      project.progressPercent = progressPercent;
    }

    await project.save();

    if (wasCompleted) {
      await notifyMany([project.clientId, ...teamUserIds(project)], {
        projectId: project._id,
        type: "stage_completed",
        title: `Stage ${stageNum} completed`,
        message: `Stage ${stageNum} of ${project.title} has been marked complete.`,
      });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/projects/:id/stages/:stageNumber/milestones
exports.addMilestone = async (req, res, next) => {
  try {
    const { id, stageNumber } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Milestone title is required" });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const stageNum = Number(stageNumber);
    let stage = project.stages.find((s) => s.number === stageNum);
    if (!stage) {
      project.stages.push({ number: stageNum, status: "pending", milestones: [] });
      stage = project.stages[project.stages.length - 1];
    }
    stage.milestones.push({ title });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/projects/:id/stages/:stageNumber/milestones/:milestoneId
exports.toggleMilestone = async (req, res, next) => {
  try {
    const { id, stageNumber, milestoneId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const stage = project.stages.find((s) => s.number === Number(stageNumber));
    if (!stage) return res.status(404).json({ message: "Stage not found" });

    const milestone = stage.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.isComplete = !milestone.isComplete;
    milestone.completedAt = milestone.isComplete ? new Date() : undefined;

    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.assignTeamMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { userId, name, role } = req.body;

    const alreadyAssigned = project.team.some((m) => m.userId.toString() === userId);
    if (alreadyAssigned) {
      return res.status(400).json({ message: "User already assigned to this project" });
    }

    project.team.push({ userId, name, role });
    await project.save();

    await notify({
      userId,
      projectId: project._id,
      type: "team_assigned",
      title: "You've been assigned to a project",
      message: `You've been added to ${project.title} as ${role}.`,
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.removeTeamMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.team = project.team.filter(
      (m) => m.userId.toString() !== req.params.userId
    );
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/projects/:id/final-review — client submits their post-handover
// rating/feedback/checklist once the project is complete.
exports.submitFinalReview = async (req, res, next) => {
  try {
    const { rating, feedback, checklist } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (req.user.role === "client" && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    project.finalReview = {
      rating,
      feedback,
      checklist: Array.isArray(checklist) ? checklist : [],
      submittedAt: new Date(),
    };
    await project.save();

    const recipients = [project.createdBy, ...teamUserIds(project)];
    await notifyMany(recipients, {
      projectId: project._id,
      type: "feedback_received",
      title: "Client submitted a final review",
      message: `${project.clientName || "The client"} left a ${rating}-star review for ${project.title}.`,
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

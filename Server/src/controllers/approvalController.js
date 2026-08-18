const Approval = require("../models/Approval");
const Project = require("../models/Project");
const { notify, notifyMany } = require("../services/notification.service");

exports.getApprovals = async (req, res, next) => {
  try {
    const { projectId, pendingOnly } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (pendingOnly === "true") filter.status = { $nin: ["approved", "rejected"] };

    if (req.user.role === "client") {
      const clientProjects = await Project.find({ clientId: req.user._id }).select("_id");
      filter.projectId = { $in: clientProjects.map((p) => p._id) };
    }

    const approvals = await Approval.find(filter).sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/approvals/pending — admin-wide pending queue (spec Section 12)
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await Approval.find({ status: { $nin: ["approved", "rejected"] } }).sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) {
    next(err);
  }
};

exports.requestApproval = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Business rule: admin/team review happens before the client ever sees
    // it — every new approval request starts in internal_review, not
    // straight to "pending" (which represents "awaiting client action").
    const approval = await Approval.create({
      projectId: req.params.id,
      projectName: project.title,
      documentName: req.body.documentName,
      documentId: req.body.documentId,
      stageNumber: req.body.stageNumber,
      status: "internal_review",
      urgency: req.body.urgency || "neutral",
      dueIn: req.body.dueIn,
      requestedBy: req.user._id,
    });

    res.status(201).json(approval);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/approvals/:id/forward — admin/team clears internal review and
// forwards the request to the client for a decision.
exports.forwardToClient = async (req, res, next) => {
  try {
    const approval = await Approval.findByIdAndUpdate(
      req.params.id,
      { status: "pending" },
      { new: true }
    );
    if (!approval) return res.status(404).json({ message: "Approval not found" });

    const project = await Project.findById(approval.projectId);
    if (project) {
      await notify({
        userId: project.clientId,
        projectId: project._id,
        type: "approval_requested",
        title: "Your review is needed",
        message: `${approval.documentName} in ${project.title} is ready for your review.`,
      });
    }

    res.json(approval);
  } catch (err) {
    next(err);
  }
};

exports.reviewApproval = async (req, res, next) => {
  try {
    const { decision, comment } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'approved' or 'rejected'" });
    }

    // Business rule: rejection requires a comment explaining why.
    if (decision === "rejected" && !comment?.trim()) {
      return res.status(400).json({ message: "A comment is required when requesting revisions" });
    }

    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ message: "Approval not found" });

    const project = await Project.findById(approval.projectId);

    // Business rule: a client cannot approve/reject a request they
    // themselves originated (self-approval guard).
    if (
      req.user.role === "client" &&
      approval.requestedBy &&
      approval.requestedBy.toString() === req.user._id.toString()
    ) {
      return res.status(403).json({ message: "You cannot review your own request" });
    }

    approval.status = decision;
    approval.comment = comment;
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    if (decision === "rejected") approval.revisionCount += 1;
    await approval.save();

    if (project) {
      // Notify the original requester (team member) of the client's decision.
      if (approval.requestedBy) {
        await notify({
          userId: approval.requestedBy,
          projectId: project._id,
          type: "approval_completed",
          title: decision === "approved" ? "Approval received" : "Revision requested",
          message:
            decision === "approved"
              ? `${approval.documentName} was approved for ${project.title}.`
              : `${approval.documentName} needs revisions: ${comment}`,
        });
      }

      if (decision === "approved") {
        // Business rule: concurrent approvals — every approval tied to this
        // stage must be approved before the project can advance.
        const stageApprovals = await Approval.find({
          projectId: project._id,
          stageNumber: approval.stageNumber,
        });
        const allApproved = stageApprovals.every((a) => a.status === "approved");

        if (allApproved) {
          const stageIdx = project.stages.findIndex((s) => s.number === approval.stageNumber);
          const stageData = { number: approval.stageNumber, status: "completed", completedAt: new Date() };
          if (stageIdx >= 0) {
            project.stages[stageIdx] = { ...project.stages[stageIdx].toObject(), ...stageData };
          } else {
            project.stages.push(stageData);
          }
          project.currentStage = Math.min(approval.stageNumber + 1, 8);
          await project.save();

          await notifyMany([project.clientId, ...project.team.map((m) => m.userId)], {
            projectId: project._id,
            type: "stage_completed",
            title: `Stage ${approval.stageNumber} completed`,
            message: `All approvals for stage ${approval.stageNumber} of ${project.title} are in — moving to the next stage.`,
          });
        }
      }
    }

    res.json(approval);
  } catch (err) {
    next(err);
  }
};

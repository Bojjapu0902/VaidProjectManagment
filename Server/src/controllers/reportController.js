const Project = require("../models/Project");
const User = require("../models/User");
const Approval = require("../models/Approval");

// GET /api/v1/reports/projects — portfolio-wide summary
exports.getProjectsReport = async (req, res, next) => {
  try {
    const [totals, byStage, byType, byStatus] = await Promise.all([
      Project.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgProgress: { $avg: "$progressPercent" },
            totalBudgetMin: { $sum: "$budget.min" },
            totalBudgetMax: { $sum: "$budget.max" },
          },
        },
      ]),
      Project.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$currentStage", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Project.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: {} },
        { $group: { _id: "$isArchived", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      summary: totals[0] || { total: 0, avgProgress: 0, totalBudgetMin: 0, totalBudgetMax: 0 },
      byStage: byStage.map((s) => ({ stage: s._id, count: s.count })),
      byType: byType.map((t) => ({ type: t._id, count: t.count })),
      archivedVsActive: byStatus.map((s) => ({ archived: s._id, count: s.count })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/projects/:id — single-project report
exports.getProjectReport = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const approvals = await Approval.find({ projectId: project._id });
    const approved = approvals.filter((a) => a.status === "approved").length;
    const rejected = approvals.filter((a) => a.status === "rejected").length;
    const pending = approvals.filter((a) => !["approved", "rejected"].includes(a.status)).length;

    res.json({
      project: {
        id: project._id,
        projectCode: project.projectCode,
        title: project.title,
        currentStage: project.currentStage,
        progressPercent: project.progressPercent,
        stages: project.stages,
        team: project.team,
      },
      approvals: { total: approvals.length, approved, rejected, pending },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/team — workload + completion metrics per team member
exports.getTeamReport = async (req, res, next) => {
  try {
    const members = await User.find({ role: { $ne: "client" } });

    const projectCounts = await Project.aggregate([
      { $match: { isArchived: false } },
      { $unwind: "$team" },
      { $group: { _id: "$team.userId", activeProjects: { $sum: 1 } } },
    ]);
    const countByUserId = new Map(projectCounts.map((c) => [c._id.toString(), c.activeProjects]));

    const approvalCounts = await Approval.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$requestedBy", approvedCount: { $sum: 1 } } },
    ]);
    const approvalsByUserId = new Map(approvalCounts.map((c) => [c._id?.toString(), c.approvedCount]));

    const report = members.map((m) => ({
      userId: m._id,
      name: m.name,
      role: m.role,
      isActive: m.isActive,
      activeProjects: countByUserId.get(m._id.toString()) || 0,
      approvalsRequested: approvalsByUserId.get(m._id.toString()) || 0,
    }));

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/approvals — approval-timeline / turnaround metrics
exports.getApprovalsReport = async (req, res, next) => {
  try {
    const approvals = await Approval.find({}).sort({ createdAt: -1 });

    const byStatus = approvals.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const reviewed = approvals.filter((a) => a.reviewedAt);
    const avgTurnaroundHours =
      reviewed.length === 0
        ? 0
        : reviewed.reduce((sum, a) => sum + (new Date(a.reviewedAt) - new Date(a.createdAt)) / 36e5, 0) /
          reviewed.length;

    res.json({
      total: approvals.length,
      byStatus,
      avgTurnaroundHours: Math.round(avgTurnaroundHours * 10) / 10,
      recent: approvals.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
};

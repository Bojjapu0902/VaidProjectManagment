const User = require("../models/User");
const Project = require("../models/Project");

// GET /api/v1/users?role=&search=
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, activeOnly } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (activeOnly === "true") filter.isActive = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeObject()));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users — admin creates a team member or client account directly
// (distinct from self-service /auth/register).
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, company } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

    const user = await User.create({ name, email, password, role, phone, company, avatarInitials: initials });
    res.status(201).json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, company, role, avatarInitials, notificationPreferences } = req.body;

    // Non-admins may only edit their own profile, and may not change their role.
    const isSelf = req.user._id.toString() === req.params.id;
    if (req.user.role !== "admin" && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const update = { name, phone, company, avatarInitials, notificationPreferences };
    if (req.user.role === "admin" && role) update.role = role;

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/:id — soft delete (deactivate), never a hard delete,
// so historical project/document/message references stay valid.
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/users/:id/reactivate
exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/team/workload — how many active projects each
// non-client team member currently carries, so admins can avoid overload
// when assigning a new project (spec Section 5, Step 4).
exports.getTeamWorkload = async (req, res, next) => {
  try {
    const teamMembers = await User.find({ role: { $ne: "client" }, isActive: true });

    const counts = await Project.aggregate([
      { $match: { isArchived: false } },
      { $unwind: "$team" },
      { $group: { _id: "$team.userId", activeProjects: { $sum: 1 } } },
    ]);
    const countByUserId = new Map(counts.map((c) => [c._id.toString(), c.activeProjects]));

    const workload = teamMembers
      .map((u) => ({
        userId: u._id,
        name: u.name,
        role: u.role,
        avatarInitials: u.avatarInitials,
        activeProjects: countByUserId.get(u._id.toString()) || 0,
      }))
      .sort((a, b) => b.activeProjects - a.activeProjects);

    res.json(workload);
  } catch (err) {
    next(err);
  }
};

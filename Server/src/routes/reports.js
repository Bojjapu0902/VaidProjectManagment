const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const {
  getProjectsReport, getTeamReport, getApprovalsReport, getProjectReport,
} = require("../controllers/reportController");

router.use(protect, requireRole("admin", "project_manager"));

router.get("/projects", getProjectsReport);
router.get("/team", getTeamReport);
router.get("/approvals", getApprovalsReport);
router.get("/projects/:id", getProjectReport);

module.exports = router;

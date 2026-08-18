const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const { getApprovals, getPendingApprovals, reviewApproval, forwardToClient } = require("../controllers/approvalController");

router.use(protect);

// Static path before the /:id param route.
router.get("/pending", requireRole("admin", "project_manager"), getPendingApprovals);

router.get("/", getApprovals);
router.put("/:id", reviewApproval);
router.put("/:id/forward", requireRole("admin", "project_manager"), forwardToClient);

module.exports = router;

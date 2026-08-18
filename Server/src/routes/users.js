const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const {
  getUsers, getUserById, createUser, updateUser,
  deactivateUser, reactivateUser, getTeamWorkload,
} = require("../controllers/userController");

router.use(protect);

// Static path must be declared before the /:id param routes below.
router.get("/team/workload", requireRole("admin", "project_manager"), getTeamWorkload);

router.get("/", requireRole("admin", "project_manager"), getUsers);
router.post("/", requireRole("admin"), createUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", requireRole("admin"), deactivateUser);
router.put("/:id/reactivate", requireRole("admin"), reactivateUser);

module.exports = router;

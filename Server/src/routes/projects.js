const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { protect, requireRole } = require("../middleware/auth");
const {
  getProjects, getProjectById, createProject, updateProject, archiveProject,
  updateStage, addMilestone, toggleMilestone,
  assignTeamMember, removeTeamMember, submitFinalReview,
} = require("../controllers/projectController");
const {
  getDocumentsByProject, getDocumentById, uploadDocument,
  updateDocument, deleteDocument, uploadNewVersion, getDocumentVersions,
} = require("../controllers/documentController");
const { getConversations, createConversation } = require("../controllers/conversationController");
const { requestApproval } = require("../controllers/approvalController");

const uploadsDir = process.env.NODE_ENV === "production"
  ? "/opt/render/project/src/uploads"
  : path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|dwg|dxf|zip|jpg|jpeg|png|docx|xlsx/i;
    allowed.test(path.extname(file.originalname)) ? cb(null, true) : cb(new Error("File type not allowed"));
  },
});

const TEAM_ROLES = ["admin", "project_manager", "architect", "designer", "engineer"];

router.use(protect);

router.get("/", getProjects);
router.post("/", requireRole("admin", "project_manager"), createProject);
router.get("/:id", getProjectById);
router.put("/:id", requireRole("admin", "project_manager"), updateProject);
router.delete("/:id", requireRole("admin", "project_manager"), archiveProject);

router.put("/:id/stages/:stageNumber", requireRole(...TEAM_ROLES), updateStage);
router.post("/:id/stages/:stageNumber/milestones", requireRole(...TEAM_ROLES), addMilestone);
router.put("/:id/stages/:stageNumber/milestones/:milestoneId", requireRole(...TEAM_ROLES), toggleMilestone);

router.post("/:id/team", requireRole("admin", "project_manager"), assignTeamMember);
router.delete("/:id/team/:userId", requireRole("admin", "project_manager"), removeTeamMember);

router.get("/:id/documents", getDocumentsByProject);
router.post("/:id/documents", requireRole(...TEAM_ROLES), upload.single("file"), uploadDocument);
router.get("/:id/documents/:docId", getDocumentById);
router.put("/:id/documents/:docId", requireRole(...TEAM_ROLES), updateDocument);
router.delete("/:id/documents/:docId", requireRole(...TEAM_ROLES), deleteDocument);
router.post("/:id/documents/:docId/version", requireRole(...TEAM_ROLES), upload.single("file"), uploadNewVersion);
router.get("/:id/documents/:docId/versions", getDocumentVersions);

// Group chats — the actual message read/send/participant endpoints live
// under /api/v1/conversations/:convId/* (see routes/conversations.js);
// these two are just the project-scoped "list my groups" / "start a group".
router.get("/:id/conversations", getConversations);
router.post("/:id/conversations", createConversation);

router.post("/:id/approvals", requireRole("admin", "project_manager"), requestApproval);

router.put("/:id/final-review", submitFinalReview);

module.exports = router;

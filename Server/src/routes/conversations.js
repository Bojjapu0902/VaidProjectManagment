const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { addParticipant, removeParticipant } = require("../controllers/conversationController");
const { getMessages, sendMessage } = require("../controllers/messageController");

router.use(protect);

router.get("/:convId/messages", getMessages);
router.post("/:convId/messages", sendMessage);
router.post("/:convId/participants", addParticipant);
router.delete("/:convId/participants/:userId", removeParticipant);

module.exports = router;

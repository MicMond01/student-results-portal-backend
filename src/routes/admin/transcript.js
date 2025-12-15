const express = require("express");
const router = express.Router();
const {
  getTranscriptData,
  downloadTranscript,
} = require("../../controllers/admin/transcript");

// Get transcript data (JSON)
router.get("/:studentId", getTranscriptData);

// Download transcript PDF
router.get("/:studentId/download", downloadTranscript);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createResult,
  bulkCreateResults,
  getAllResults,
  updateResult,
  deleteResult,
} = require("../../controllers/admin/results");

router.route("/").post(createResult).get(getAllResults);

router.post("/bulk", bulkCreateResults);

router.route("/:id").patch(updateResult).delete(deleteResult);

module.exports = router;

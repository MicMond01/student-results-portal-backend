const express = require("express");
const router = express.Router();

const getAllResult = require("../controllers/resultController");

router.route("/").get(getAllResult);

module.exports = router;

const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../../controllers/admin/statistics");

router.get("/", getDashboardStats);

module.exports = router;

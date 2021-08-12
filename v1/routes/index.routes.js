const express = require("express");
const router = express.Router();

// NOTE: ALL ROUTES FILES GO HERE
router.use("/serp", require("./task.routes"));

module.exports = router;

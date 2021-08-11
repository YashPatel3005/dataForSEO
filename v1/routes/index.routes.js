const express = require("express");
const router = express.Router();

// NOTE: ALL ROUTES FILES GO HERE
router.use("/serp", require("./serp.routes"));

module.exports = router;

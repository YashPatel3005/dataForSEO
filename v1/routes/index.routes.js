const express = require("express");
const router = express.Router();

// NOTE: ALL ROUTES FILES GO HERE

router.use("/taskRunner", require("./taskRunner.routes"));

router.use("/admin", require("./admin.routes"));

module.exports = router;

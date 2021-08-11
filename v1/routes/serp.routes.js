const express = require("express");
const router = express.Router();

const { getAllRecords } = require("../controllers/serp.controller");

router.get("/getAllRecords", getAllRecords);

module.exports = router;

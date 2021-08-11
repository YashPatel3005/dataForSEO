const express = require("express");
const router = express.Router();

const { getAllTasks, sendTask } = require("../controllers/serp.controller");

router.post("/sendTask", sendTask);
router.get("/getAllTasks", getAllTasks);

module.exports = router;

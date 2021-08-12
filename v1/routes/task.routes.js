const express = require("express");
const router = express.Router();

const { getAllTasks, sendTask } = require("../controllers/task.controller");

const { taskValidator } = require("../../validators/task.validator");
const { validatorFunc } = require("../../helpers/commonFunction.helper");

router.post("/sendTask", taskValidator, validatorFunc, sendTask);
router.get("/getAllTasks", getAllTasks);

module.exports = router;

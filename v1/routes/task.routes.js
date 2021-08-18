const express = require("express");
const router = express.Router();

const {
  getAllTasks,
  sendTask,
  login,
} = require("../controllers/task.controller");

const {
  taskValidator,
  loginValidator,
} = require("../../validators/task.validator");

const { validatorFunc } = require("../../helpers/commonFunction.helper");

const { authenticate } = require("../../middleware/auth.middleware");

router.post("/login", loginValidator, validatorFunc, login);

router.post("/sendTask", authenticate, taskValidator, validatorFunc, sendTask);

router.get("/getAllTasks", authenticate, getAllTasks);

module.exports = router;

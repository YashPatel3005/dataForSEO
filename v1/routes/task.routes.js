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

router.post("/sendTask", taskValidator, validatorFunc, sendTask);

router.get("/getAllTasks", getAllTasks);

module.exports = router;

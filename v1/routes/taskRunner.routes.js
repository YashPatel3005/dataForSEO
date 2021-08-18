const express = require("express");
const router = express.Router();

const { createUser } = require("../controllers/taskRunner.controller");
const { userValidator } = require("../../validators/user.validator");
const { validatorFunc } = require("../../helpers/commonFunction.helper");

router.post("/createUser", userValidator, validatorFunc, createUser);

module.exports = router;

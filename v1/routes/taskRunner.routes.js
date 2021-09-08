const express = require("express");
const router = express.Router();

const { createAdmin } = require("../controllers/taskRunner.controller");
const { adminValidator } = require("../../validators/admin.validator");
const { validatorFunc } = require("../../helpers/commonFunction.helper");

//create super admin
router.post("/createAdmin", adminValidator, validatorFunc, createAdmin);

module.exports = router;

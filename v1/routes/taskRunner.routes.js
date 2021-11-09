const express = require("express");
const router = express.Router();

const {
  createAdmin,
  createGoogleAuth,
} = require("../controllers/taskRunner.controller");
const { adminValidator } = require("../../validators/admin.validator");
const { validatorFunc } = require("../../helpers/commonFunction.helper");

//create super admin
router.post("/createAdmin", adminValidator, validatorFunc, createAdmin);

router.post("/createGoogleAuth", createGoogleAuth);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  resetPasswordLink,
  resetPassword,
} = require("../../web/controller/auth.controller");

const { validatorFunc } = require("../../helpers/commonFunction.helper");

const { resetPasswordValidator } = require("../../validators/admin.validator");

router.get("/resetPassword", resetPasswordLink);

router.post(
  "/set-password",
  resetPasswordValidator,
  validatorFunc,
  resetPassword
);

module.exports = router;

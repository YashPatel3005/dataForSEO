const { body } = require("express-validator");

exports.adminValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email Id is required.")
    .isEmail()
    .withMessage("Please enter valid email.")
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Please enter valid password"),
  // body("firstName")
  //   .not()
  //   .isEmpty()
  //   .withMessage("First name is required.")
  //   .trim(),
  // body("lastName").not().isEmpty().withMessage("Last name is required.").trim(),
  // body("permissionLevel")
  //   .not()
  //   .isEmpty()
  //   .withMessage("Please select permission level.")
  //   .matches(/^[1-6]$/)
  //   .withMessage("Please select valid permission level.")
  //   .toInt()
  //   .trim(),
];

exports.loginValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email Id is required.")
    .isEmail()
    .withMessage("Please enter valid email.")
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Please enter valid password"),
];

exports.userValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email Id is required.")
    .isEmail()
    .withMessage("Please enter valid email.")
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password is required.")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Please enter valid password"),
  body("firstName")
    .not()
    .isEmpty()
    .withMessage("First name is required.")
    .trim(),
  body("lastName").not().isEmpty().withMessage("Last name is required.").trim(),
  body("permissionLevel")
    .not()
    .isEmpty()
    .withMessage("Please select permission level.")
    .matches(/^[1-2]$/)
    .withMessage("Please select valid permission level.")
    .toInt()
    .trim(),
];

exports.projectValidator = [
  body("domain").not().isEmpty().withMessage("Domain is required.").trim(),
  body("projectName")
    .not()
    .isEmpty()
    .withMessage("Project name is required.")
    .trim(),
];

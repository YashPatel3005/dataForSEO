const { body } = require("express-validator");

exports.taskValidator = [
  body("locationCode")
    .not()
    .isEmpty()
    .withMessage("Location code is required.")
    .isNumeric()
    .withMessage("Please enter valid location code.")
    .trim(),
  body("keyword").not().isEmpty().withMessage("Keyword is required.").trim(),
  body("domain").not().isEmpty().withMessage("Domain is required.").trim(),
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

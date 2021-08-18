const { body } = require("express-validator");

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
];

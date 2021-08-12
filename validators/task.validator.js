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
  // body("domain").not().isEmpty().withMessage("Domain is required.").trim(),
];

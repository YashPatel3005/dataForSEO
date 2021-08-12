const { validationResult } = require("express-validator");

// show validation error message
exports.validatorFunc = (req, res, next) => {
  let errArray = {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send({
      statusCode: 422,
      message: errors.array()[0].msg,
      error: true,
      data: {},
    });
  }
  next();
};

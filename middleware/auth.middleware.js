const User = require("../models/user.model");
const commonMessage = require("../helpers/commonMessage.helper");
const jwt = require("jsonwebtoken");

let authenticate = async (req, res, next) => {
  try {
    if (!req.header("Authorization")) {
      return res.status(401).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.UNAUTHORIZED_USER,
        status: false,
      });
    }

    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.NOT_TOKEN,
        status: false,
      });
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      return res.status(401).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.UNAUTHORIZED_USER,
        status: false,
      });
    }

    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    console.log("error in authenticate middleware=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

module.exports = { authenticate };

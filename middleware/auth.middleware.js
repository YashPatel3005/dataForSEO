const Admin = require("../models/admin.model");
const commonMessage = require("../helpers/commonMessage.helper");
const checkPermission = require("../helpers/permissionLevels.helper");
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
    const admin = await Admin.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!admin) {
      return res.status(401).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.UNAUTHORIZED_USER,
        status: false,
      });
    }

    const isPermitted = await checkPermission(
      Number(admin.permissionLevel),
      req.route["path"]
    );

    if (isPermitted == false) {
      return res.status(403).send({
        data: {},
        message: "Sorry, you don't have access to this page or resource.",
        status: false,
      });
    }

    req.token = token;
    req.admin = admin;

    next();
  } catch (error) {
    console.log("error in authenticate middleware=> ", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.UNAUTHORIZED_USER,
        status: false,
      });
    }
    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

module.exports = { authenticate };

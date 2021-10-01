const Admin = require("../../models/admin.model");

const dateFunc = require("../../helpers/dateFunctions.helper");
const commonMessage = require("../../helpers/commonMessage.helper");

const constants = require("../../app.constant");

exports.resetPasswordLink = async (req, res) => {
  try {
    if (req.query.token == undefined) {
      return res.render("notFound");
    }
    let token = req.query.token;

    let currentDate = await dateFunc.currentUtcTime();
    let message = "";
    const user = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gte: currentDate },
    });

    if (!user) {
      //   return res.status(400).send({
      //     data: {},
      //     message: commonMessage.USER.RESET_LINK_EXPIRED,
      //     status: false,
      //   });
      message = req.flash(
        "error",
        "Your reset password link has been expired."
      );

      return res.render("forgotPassword", {
        req: req,
        // logoUrl: constants.LOGO_AWS_IMAGE_URL,
        constants: constants,
        error: req.flash("error"),
        success: req.flash("success"),
      });
    }

    // return res.status(200).send({
    //   data: {},
    //   message: "You can reset a password.",
    //   status: true,
    // });
    res.render("forgotPassword", {
      req: req,
      //   logoUrl: constants.LOGO_AWS_IMAGE_URL,
      constants: constants,
      message: message,
      error: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.log("error in resetPasswordLink()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const reqBody = req.body;

    let message = "";
    if (reqBody.newPassword !== reqBody.confirmPassword) {
      message = req.flash(
        "error",
        "New password and confirm password not matched."
      );

      return res.render("message", {
        req: req,
        // logoUrl: constants.LOGO_AWS_IMAGE_URL,
        appBaseUrl: process.env.BASEURL,
        constants: constants,
        message: message,
        error: req.flash("error"),
        success: req.flash("success"),
      });
      //   return res.redirect(
      //     `${appBaseUrl}/web/reset-password?token=${reqBody.resetPasswordToken}`
      //   );
    }
    let currentDate = dateFunc.currentUtcTime();

    const user = await Admin.findOne({
      resetPasswordToken: reqBody.resetPasswordToken,
      resetPasswordExpires: { $gte: currentDate },
    });

    if (!user) {
      //   return res.status(400).send({
      //     data: {},
      //     message: commonMessage.USER.RESET_LINK_EXPIRED,
      //     status: false,
      //   });
      message = req.flash(
        "error",
        "Your reset password link has been expired."
      );

      return res.render("forgotPassword", {
        req: req,
        // logoUrl: constants.LOGO_AWS_IMAGE_URL,
        constants: constants,
        message: message,
        error: req.flash("error"),
        success: req.flash("success"),
      });
    }

    // if (reqBody.newPassword !== reqBody.confirmPassword) {
    //   return res.status(400).send({
    //     data: {},
    //     message: commonMessage.USER.PASSWORD_MISMATCH,
    //     status: false,
    //   });
    // }

    user.password = reqBody.newPassword;
    user.updatedAt = await dateFunc.currentUtcTime();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // return res.status(200).send({
    //   data: {},
    //   message: commonMessage.USER.RESET_PASSWORD_SUCCESS,
    //   status: true,
    // });
    message = req.flash("success", "Your password successfully changed.");

    res.render("forgotPassword", {
      req: req,
      //   logoUrl: constants.LOGO_AWS_IMAGE_URL,
      constants: constants,
      message: message,
      error: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.log("error in resetPassword()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

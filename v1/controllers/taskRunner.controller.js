const dateFunc = require("../../helpers/dateFunctions.helper");
const Admin = require("../../models/admin.model");
const commonMessage = require("../../helpers/commonMessage.helper");

exports.createAdmin = async (req, res) => {
  try {
    const reqBody = req.body;

    reqBody.createdAt = dateFunc.currentUtcTime();
    reqBody.updatedAt = dateFunc.currentUtcTime();

    const emailIdExists = await Admin.findOne({ email: req.body.email });

    if (emailIdExists) {
      return res.status(400).send({
        message:
          "Admin user with this email id already exists. Please enter different email id.",
        status: false,
        data: {},
      });
    }

    const admin = await Admin.create(reqBody);

    return res.status(200).send({
      data: admin,
      message: "Super admin credential created.",
      status: true,
    });
  } catch (error) {
    console.log("error in createAdmin()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

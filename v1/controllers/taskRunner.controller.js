const dateFunc = require("../../helpers/dateFunctions.helper");
const User = require("../../models/user.model");
const commonMessage = require("../../helpers/commonMessage.helper");

exports.createUser = async (req, res) => {
  try {
    const reqBody = req.body;

    reqBody.createdAt = dateFunc.currentUtcTime();
    reqBody.updatedAt = dateFunc.currentUtcTime();

    const user = await User.create(reqBody);

    return res.status(200).send({
      data: user,
      message: "user credential created.",
      status: true,
    });
  } catch (error) {
    console.log("error in createUser()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

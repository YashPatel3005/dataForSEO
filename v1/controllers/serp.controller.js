const commonMessage = require("../../helpers/commonMessage.helper");

//get all records
exports.getAllRecords = async (req, res) => {
  try {
    return res.status(200).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getAllRecords()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

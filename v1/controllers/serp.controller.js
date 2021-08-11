const axios = require("axios");

const commonMessage = require("../../helpers/commonMessage.helper");

//send Tasks in SERP Regular API
exports.sendTask = async (req, res) => {
  try {
    const data = await axios({
      method: "post",
      url: process.env.SERP_API,
      auth: {
        username: process.env.SERP_API_USERNAME,
        password: process.env.SERP_API_PASSWORD,
      },
      data: [
        {
          keyword: encodeURI("albert einstein"),
          language_code: "en",
          location_code: 2840,
        },
      ],
      headers: {
        "content-type": "application/json",
      },
    });

    return res.status(200).send({
      data: data.data,
      message: commonMessage.ERROR_MESSAGE.GENERAL_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in sendTask()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

//get all Tasks
exports.getAllTasks = async (req, res) => {
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

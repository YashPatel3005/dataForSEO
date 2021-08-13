const axios = require("axios");

const commonMessage = require("../../helpers/commonMessage.helper");
const dateFunction = require("../../helpers/dateFunctions.helper.");

const Task = require("../../models/task.model");

//send Tasks in SERP Regular API
exports.sendTask = async (req, res) => {
  try {
    const { keyword, domain, locationCode } = req.body;

    let seoData = await axios({
      method: "post",
      url: process.env.SERP_API,
      auth: {
        username: process.env.SERP_API_USERNAME,
        password: process.env.SERP_API_PASSWORD,
      },
      data: [
        {
          keyword: encodeURI(keyword),
          location_code: locationCode,
          language_code: "en",
          // url: domain,
          // depth: "100",
          // se_domain: "google.com.au",
        },
      ],
      headers: {
        "content-type": "application/json",
      },
    });
    let items;
    let result;
    if (seoData.data.tasks) {
      items = seoData.data.tasks[0].result[0].items;
      for (let i of items) {
        if (
          seoData.data.tasks[0].result[0].type == "organic" &&
          i.domain == domain
        ) {
          result = i;
        }
      }
    }

    if (result) {
      result.rankGroup = result.rank_group;
      result.rankAbsolute = result.rank_absolute;
      delete result.rank_group;
      delete result.rank_absolute;

      await Task.create({
        keyword: seoData.data.tasks[0].result[0].keyword,
        type: seoData.data.tasks[0].result[0].type,
        seDomain: seoData.data.tasks[0].result[0].se_domain,
        locationCode: seoData.data.tasks[0].result[0].location_code,
        languageCode: seoData.data.tasks[0].result[0].language_code,
        date: seoData.data.tasks[0].result[0].datetime,
        item: result,
        createdAt: dateFunction.currentUtcTime(),
      });
    }

    return res.status(200).send({
      data: {}, // seoData.data.tasks[0].result
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
    let { limit, page } = req.query;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const result = await Task.find({})
      .sort({ createdAt: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();

    const total = await Task.countDocuments({});

    return res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.TASK.DATA_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getAllTasks()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

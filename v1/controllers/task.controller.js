const axios = require("axios");
const _ = require("lodash");

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
      result.keyword = seoData.data.tasks[0].result[0].keyword;
      result.seDomain = seoData.data.tasks[0].result[0].se_domain;
      result.locationCode = seoData.data.tasks[0].result[0].location_code;
      result.languageCode = seoData.data.tasks[0].result[0].language_code;
      result.date = dateFunction.getAfterMidnightTimeOfDate(
        dateFunction.currentUtcTime()
      );
      result.createdAt = dateFunction.currentUtcTime();

      result.rankGroup = result.rank_group;
      result.rankAbsolute = result.rank_absolute;

      delete result.rank_group;
      delete result.rank_absolute;

      await Task.create(result);
    } else {
      return res.status(400).send({
        data: {},
        message: commonMessage.TASK.VALID_DOMAIN,
        status: false,
      });
      // result = {
      //   type: null,
      //   rankGroup: null,
      //   rankAbsolute: null,
      //   domain: null,
      //   title: null,
      //   description: null,
      //   url: null,
      //   breadcrumb: null,
      //   keyword: keyword,
      //   seDomain: null,
      //   locationCode: null,
      //   languageCode: null,
      //   date: null,
      //   createdAt: dateFunction.currentUtcTime(),
      // };
      // await Task.create(result);
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

    // SORTING STARTS
    let field;
    let value;
    if (req.query.sort) {
      const sortBy = req.query.sort.split(":");
      field = sortBy[0];
      if (sortBy[1] == "asc") {
        value = 1;
      } else {
        value = -1;
      }
    } else {
      field = "createdAt";
      value = -1;
    }
    // SORTING ENDS

    let projection = {
      breadcrumb: 0,
      languageCode: 0,
      seDomain: 0,
      type: 0,
      description: 0,
      title: 0,
    };
    let result = await Task.find({}, projection)
      .sort({ [field]: value })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();
    // const total = await Task.countDocuments({});

    result = result.reduce(
      (
        arr,
        {
          keyword,
          domain,
          date,
          url,
          createdAt,
          rankAbsolute,
          rankGroup,
          prevRankAbsolute,
          locationCode,
          _id,
        }
      ) => {
        let found = arr.find((v) => v.keyword == keyword && v.domain == domain);
        if (found) {
          if (found.date < date) found.date = date;
        } else
          arr.push({
            keyword,
            date,
            domain,
            url,
            createdAt,
            rankAbsolute,
            rankGroup,
            prevRankAbsolute,
            locationCode,
            _id,
          });

        return arr;
      },
      []
    );

    const total = result.length;

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

const _ = require("lodash");
const axios = require("axios");
const fs = require("fs");

const Json2csvParser = require("json2csv").Parser;

const commonMessage = require("../../helpers/commonMessage.helper");
const dateFunc = require("../../helpers/dateFunctions.helper");

const Admin = require("../../models/admin.model");
const Project = require("../../models/project.model");
const SubProject = require("../../models/subProject.model");
const appConstant = require("../../app.constant");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email });

    if (!admin) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ADMIN.USER_NOT_FOUND,
        status: false,
      });
    }

    if (admin.password !== password) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ADMIN.INVALID_PASSWORD,
        status: false,
      });
    }

    const token = await admin.generateAuthToken();
    await admin.save();
    let resData = _.pick(admin, ["email", "permissionLevel"]);
    resData.token = token;

    return res.status(200).send({
      data: resData,
      message: commonMessage.ADMIN.LOGIN_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in login()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

//create user
// exports.createUser = async (req, res) => {
//   try {
//     let reqBody = req.body;
//     console.log(reqBody);
//   } catch (error) {
//     console.log("error in createUser()=> ", error);

//     return res.status(400).send({
//       data: {},
//       message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
//       status: false,
//     });
//   }
// };

exports.addProject = async (req, res) => {
  try {
    let reqBody = req.body;

    reqBody.createdAt = dateFunc.currentUtcTime();
    reqBody.updatedAt = dateFunc.currentUtcTime();

    const isExists = await Project.findOne({
      projectName: reqBody.projectName,
    });

    if (isExists) {
      return res.status(400).send({
        data: {},
        message: commonMessage.PROJECT.PROJECT_ALREADY_EXITS,
        status: false,
      });
    }

    const projectData = await Project.create(reqBody);

    return res.status(200).send({
      data: projectData,
      message: commonMessage.PROJECT.ADD_PROJECT_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in addProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.editProject = async (req, res) => {
  try {
    let id = req.params.id;
    let reqBody = req.body;

    const projectData = await Project.findOne({
      _id: id,
    });

    if (projectData.projectName !== reqBody.projectName) {
      const isExists = await Project.findOne({
        projectName: reqBody.projectName,
      });

      if (isExists) {
        return res.status(400).send({
          data: {},
          message: commonMessage.PROJECT.PROJECT_ALREADY_EXITS,
          status: false,
        });
      }
    }

    reqBody.updatedAt = dateFunc.currentUtcTime();

    await Project.updateOne({ _id: id }, { $set: reqBody });

    return res.status(200).send({
      data: {},
      message: commonMessage.PROJECT.UPDATE_PROJECT_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in editProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.viewProject = async (req, res) => {
  try {
    let id = req.params.id;

    const projectData = await Project.findOne({
      _id: id,
    });

    return res.status(200).send({
      data: projectData,
      message: commonMessage.PROJECT.VIEW_PROJECT_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in viewProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    let id = req.params.id;

    await Project.deleteOne({
      _id: id,
    });

    await SubProject.deleteMany({
      _projectId: id,
    });

    return res.status(200).send({
      data: {},
      message: commonMessage.PROJECT.DELETE_PROJECT_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in deleteProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getProjectsList = async (req, res) => {
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

    const result = await Project.find({})
      .collation({ locale: "en" })
      .sort({ [field]: value })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();

    let total = await Project.countDocuments({});

    return res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.PROJECT.PROJECT_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getProjectsList()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getProjectsListDrpDwn = async (req, res) => {
  try {
    const result = await Project.find({})
      .collation({ locale: "en" })
      .sort({ projectName: 1 });

    return res.status(200).send({
      data: result,
      message: commonMessage.PROJECT.PROJECT_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getProjectsListDrpDwn()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.addSubProject = async (req, res) => {
  try {
    const { keyword, domain, locationCode, keywordCheckFrequency, _projectId } =
      req.body;

    let createTask = await axios({
      method: "post",
      url: "https://api.dataforseo.com/v3/serp/google/organic/task_post",
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

    async function getTask() {
      let taskId = createTask.data.tasks[0].id;
      console.log(taskId);

      let getTaskData = await axios({
        method: "get",
        url:
          "https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/" +
          taskId,
        auth: {
          username: process.env.SERP_API_USERNAME,
          password: process.env.SERP_API_PASSWORD,
        },
        headers: {
          "content-type": "application/json",
        },
      });

      let items;
      let result;
      if (getTaskData.data.tasks) {
        items = getTaskData.data.tasks[0].result[0].items;
        for (let i of items) {
          if (
            getTaskData.data.tasks[0].result[0].type == "organic" &&
            i.domain == domain
          ) {
            result = i;
          }
        }
      }

      let currentDate = dateFunc.currentUtcTime();
      console.log(currentDate);

      let nextDate;
      if (keywordCheckFrequency === appConstant.keywordCheckFrequency.weekly) {
        nextDate = dateFunc.addDate(currentDate, 7, "days");
        nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
        console.log(nextDate);
      } else if (
        keywordCheckFrequency === appConstant.keywordCheckFrequency.fortnightly
      ) {
        nextDate = dateFunc.addDate(currentDate, 15, "days");
        nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
        console.log(nextDate);
      } else {
        nextDate = dateFunc.addDate(currentDate, 1, "months");
        nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
        console.log(nextDate);
      }

      if (result) {
        result.keyword = getTaskData.data.tasks[0].result[0].keyword;
        result.seDomain = getTaskData.data.tasks[0].result[0].se_domain;
        result.locationCode = getTaskData.data.tasks[0].result[0].location_code;
        result.languageCode = getTaskData.data.tasks[0].result[0].language_code;

        result.currDate = dateFunc.getAfterMidnightTimeOfDate(currentDate);
        result.createdAt = currentDate;
        result.updatedAt = currentDate;

        result.rankGroup = result.rank_group;
        result.rankAbsolute = result.rank_absolute;

        result.keywordCheckFrequency = keywordCheckFrequency;
        result._projectId = _projectId;
        result.nextDate = nextDate;

        delete result.rank_group;
        delete result.rank_absolute;
        console.log(result);

        await SubProject.create(result);
      } else {
        return res.status(400).send({
          data: {},
          message: commonMessage.TASK.VALID_DOMAIN,
          status: false,
        });
      }

      return res.status(200).send({
        data: {},
        message: commonMessage.SUB_PROJECT.ADD_SUB_PROJECT_SUCCESS,
        status: true,
      });
    }

    if (createTask.data.status_code === 20000) {
      setTimeout(getTask, 8000);
    }
  } catch (error) {
    console.log("error in addSubProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getSubProjectsList = async (req, res) => {
  try {
    let id = req.params.id;
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

    let query = { _projectId: id };

    const result = await SubProject.find(query, projection)
      .collation({ locale: "en" })
      .sort({ [field]: value })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();

    let total = await SubProject.countDocuments(query);

    return res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.SUB_PROJECT.SUB_PROJECT_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getSubProjectsList()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.deleteSubProject = async (req, res) => {
  try {
    let id = req.params.id;

    await SubProject.deleteOne({
      _id: id,
    });

    return res.status(200).send({
      data: {},
      message: commonMessage.SUB_PROJECT.DELETE_SUB_PROJECT_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in deleteSubProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.subProjectDashboard = async (req, res) => {
  try {
    let id = req.params.id;

    const subProjectData = await SubProject.find({ _projectId: id });

    let resultObj = {};
    let topSpot = 0;
    let topThree = 0;
    let fourToTen = 0;
    let elevenToTwenty = 0;
    let twentyOneToFifty = 0;
    let fiftyOneToHundred = 0;
    let outOfTopHundred = 0;

    if (subProjectData && subProjectData.length > 0) {
      for (let i = 0; i < subProjectData.length; i++) {
        //top spot
        if (subProjectData[i].rankAbsolute === 1) {
          topSpot = topSpot + 1;
        }

        // top three 1-3
        if (subProjectData[i].rankAbsolute <= 3) {
          topThree = topThree + 1;
        }

        //4 to 10
        if (
          subProjectData[i].rankAbsolute > 3 &&
          subProjectData[i].rankAbsolute <= 10
        ) {
          fourToTen = fourToTen + 1;
        }

        //11 to 20
        if (
          subProjectData[i].rankAbsolute > 10 &&
          subProjectData[i].rankAbsolute <= 20
        ) {
          elevenToTwenty = elevenToTwenty + 1;
        }

        //21 to 50
        if (
          subProjectData[i].rankAbsolute > 20 &&
          subProjectData[i].rankAbsolute <= 50
        ) {
          twentyOneToFifty = twentyOneToFifty + 1;
        }

        //51 to 100
        if (
          subProjectData[i].rankAbsolute > 50 &&
          subProjectData[i].rankAbsolute <= 100
        ) {
          fiftyOneToHundred = fiftyOneToHundred + 1;
        }

        //100+
        if (subProjectData[i].rankAbsolute > 100) {
          outOfTopHundred = outOfTopHundred + 1;
        }
      }
    }

    resultObj.totalKeywords = subProjectData.length;
    resultObj.topSpot = topSpot;
    resultObj.topThree = topThree;
    resultObj.fourToTen = fourToTen;
    resultObj.elevenToTwenty = elevenToTwenty;
    resultObj.twentyOneToFifty = twentyOneToFifty;
    resultObj.fiftyOneToHundred = fiftyOneToHundred;
    resultObj.outOfTopHundred = outOfTopHundred;

    console.log(resultObj);

    return res.status(200).send({
      data: resultObj,
      message: commonMessage.SUB_PROJECT.SUB_PROJECT_ANALYTICAL_DATA_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in subProjectDashboard()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.projectDashboard = async (req, res) => {
  try {
    const subProjectData = await SubProject.find({});

    let resultObj = {};
    let topSpot = 0;
    let topTen = 0;
    let topThirty = 0;
    let topHundred = 0;

    if (subProjectData && subProjectData.length > 0) {
      for (let i = 0; i < subProjectData.length; i++) {
        //top spot
        if (subProjectData[i].rankAbsolute === 1) {
          topSpot = topSpot + 1;
        }
        // top 10
        if (subProjectData[i].rankAbsolute <= 10) {
          topTen = topTen + 1;
        }

        //top 30
        if (subProjectData[i].rankAbsolute <= 30) {
          topThirty = topThirty + 1;
        }

        //top 100
        if (subProjectData[i].rankAbsolute <= 100) {
          topHundred = topHundred + 1;
        }
      }
    }

    resultObj.totalKeywords = subProjectData.length;
    resultObj.topSpot = topSpot;
    resultObj.topTen = topTen;
    resultObj.topThirty = topThirty;
    resultObj.topHundred = topHundred;

    return res.status(200).send({
      data: resultObj,
      message: commonMessage.PROJECT.PROJECT_ANALYTICAL_DATA_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in projectDashboard()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.exportSubProjectToCsv = async (req, res) => {
  try {
    const id = req.params.id;
    const subProjectData = await SubProject.find({ _projectId: id });

    let subProjectList = [];
    for (let i = 0; i < subProjectData.length; i++) {
      const resJson = {};
      resJson["sr"] = i + 1;
      resJson["keywords"] = subProjectData[i].keyword;
      resJson["previousRanking"] = subProjectData[i].prevRankAbsolute;
      resJson["currentRanking"] = subProjectData[i].rankAbsolute;
      resJson["difference"] =
        subProjectData[i].rankAbsolute - subProjectData[i].prevRankAbsolute;
      resJson["url"] = subProjectData[i].url;

      subProjectList.push(resJson);
    }

    const fields = [
      { label: "Sr", value: "sr" },
      { label: "Keywords", value: "keywords" },
      { label: "Previous ranking", value: "previousRanking" },
      { label: "Current ranking", value: "currentRanking" },
      { label: "Difference", value: "difference" },
      { label: "URL", value: "url" },
    ];

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(subProjectList);

    const subProjectCSVFile = `${process.env.REPORTS_PATH}/subProjectCSVFile.csv`;

    fs.writeFile(subProjectCSVFile, csv, function (err) {
      if (err) throw err;
    });
    function myFunc() {
      res.download(subProjectCSVFile);
    }

    setTimeout(() => {
      myFunc();
    }, 2000);
    return;
  } catch (error) {
    console.log("error in projectDashboard()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

const _ = require("lodash");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const Json2csvParser = require("json2csv").Parser;

const commonMessage = require("../../helpers/commonMessage.helper");
const commonFunction = require("../../helpers/commonFunction.helper");

const dateFunc = require("../../helpers/dateFunctions.helper");
const requestHelper = require("../../helpers/requestHelper.helper");

const Admin = require("../../models/admin.model");
const Project = require("../../models/project.model");
const SubProject = require("../../models/subProject.model");
const Keyword = require("../../models/keywords.model");

const sendEmail = require("../../services/email.service");

const userPasswordTemplate = require("../../services/emailTemplates/sendUserPasswordTemplate");

const appConstant = require("../../app.constant");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findByCredentials(email, password);

    if (admin === 1) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ADMIN.USER_NOT_FOUND,
        status: false,
      });
    }

    if (admin === 2) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ADMIN.INVALID_PASSWORD,
        status: false,
      });
    }

    const token = await admin.generateAuthToken();
    await admin.save();
    let resData = _.pick(admin, ["email", "permissionLevel", "_id"]);
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
exports.createUser = async (req, res) => {
  try {
    let reqBody = req.body;

    reqBody.createdAt = dateFunc.currentUtcTime();
    reqBody.updatedAt = dateFunc.currentUtcTime();

    const emailIdExists = await Admin.findOne({ email: req.body.email });

    if (emailIdExists) {
      return res.status(400).send({
        message: commonMessage.USER.USER_ALREADY_EXISTS,
        status: false,
        data: {},
      });
    }

    let randomPassword = commonFunction.generateRandomPassword();

    reqBody.password = randomPassword;

    const user = await Admin.create(reqBody);

    await Project.updateMany(
      { _id: { $in: user.projectAccess } },
      { $push: { assignedUsers: user._id } }
    );

    await sendEmail(
      reqBody.email,
      appConstant.email_template.account_created_mail,
      userPasswordTemplate({
        email: reqBody.email,
        password: randomPassword,
      })
    );

    return res.status(200).send({
      data: user,
      message: commonMessage.USER.CREATED_USER_SUCCESS,
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

exports.getUserList = async (req, res) => {
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

    const result = await Admin.find({
      permissionLevel: { $ne: appConstant.adminPermissionLevel.admin },
    })
      .collation({ locale: "en" })
      .sort({ [field]: value })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();

    let total = await Admin.countDocuments({
      permissionLevel: { $ne: appConstant.adminPermissionLevel.admin },
    });

    return res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.USER.USERS_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getUserList()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    let id = req.params.id;

    await Admin.deleteOne({ _id: id });

    await Project.updateMany(
      { assignedUsers: { $in: id } },
      { $pull: { assignedUsers: id } }
    );

    return res.status(200).send({
      data: {},
      message: commonMessage.USER.DELETE_USER_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in deleteUser()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getViewUserProfile = async (req, res) => {
  try {
    let id = req.params.id;

    const userData = await Admin.findOne({ _id: id })
      .populate("projectAccess", "domain projectName _id")
      .exec();

    return res.status(200).send({
      data: userData,
      message: commonMessage.USER.VIEW_USER_PROFILE_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getViewUserProfile()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(400).send({
        data: {},
        message: commonMessage.ERROR_MESSAGE.UNAUTHORIZED_USER,
        status: false,
      });
    }

    let passwordCheck = await bcrypt.compare(currentPassword, admin.password);

    if (!passwordCheck) {
      return res.status(400).send({
        data: {},
        message: commonMessage.USER.INVALID_CURRENT_PASSWORD,
        status: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        data: {},
        message: commonMessage.USER.PASSWORD_MISMATCH,
        status: false,
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).send({
        data: {},
        message: commonMessage.USER.PASSWORD_MATCH_ERROR,
        status: false,
      });
    }

    admin.password = newPassword;
    admin.updatedAt = await dateFunc.currentUtcTime();

    await admin.save();

    return res.status(200).send({
      data: {},
      message: commonMessage.USER.PASSWORD_UPDATE_SUCCESS,
      status: true,
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

    await Keyword.deleteMany({
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

    let query = {};

    if (req.admin.permissionLevel === appConstant.adminPermissionLevel.admin) {
      query = {};
    } else {
      query = { assignedUsers: { $in: req.admin._id } };
    }

    const result = await Project.find()
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

exports.exportProjectToCsv = async (req, res) => {
  try {
    const projectData = await Project.find({});

    let projectList = [];
    for (let i = 0; i < projectData.length; i++) {
      const resJson = {};
      resJson["sr"] = i + 1;
      resJson["domain"] = projectData[i].domain;
      resJson["projectName"] = projectData[i].projectName;

      projectList.push(resJson);
    }

    const fields = [
      { label: "Sr", value: "sr" },
      { label: "Domain", value: "domain" },
      { label: "Project Name", value: "projectName" },
    ];

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(projectList);

    const projectCSVFile = `${process.env.REPORTS_PATH}/projectCSVFile.csv`;

    fs.writeFile(projectCSVFile, csv, function (err) {
      if (err) throw err;
    });
    function myFunc() {
      res.download(projectCSVFile);
    }

    setTimeout(() => {
      myFunc();
    }, 2000);
    return;
  } catch (error) {
    console.log("error in exportProjectToCsv()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.exportProjectToGoogleSheet = async (req, res) => {
  try {
    const projectData = await Project.find({});

    // if (projectData && projectData.length > 0) {
    const sheetHeading = [["Sr No", "Project Name", "Domain"]];
    const sheetTitle = "Project List";
    const defineSheet = "Sheet1!A1:D1";
    const data = await commonFunction.generateGoogleSheet(
      sheetTitle,
      sheetHeading,
      defineSheet
    );

    let sheetId = data.sheetId;

    const accessToken = await commonFunction.refreshToken();

    let sheetBody = [];

    for (let i = 0; i < projectData.length; i++) {
      sheetBody.push([
        `${i + 1}`,
        projectData[i].projectName,
        projectData[i].domain,
      ]);
    }

    await commonFunction.appendDataInSheet(accessToken, sheetId, sheetBody);

    return res.status(200).send({
      data: data,
      message: commonMessage.PROJECT.PROJECT_EXPORT_TO_GOOGLE_SHEET_SUCCESS,
      status: true,
    });
    // } else {
    //   return res.status(400).send({
    //     data: {},
    //     message: commonMessage.ERROR_MESSAGE.NO_DATA_FOUND,
    //     status: false,
    //   });
    // }
  } catch (error) {
    console.log("error in exportProjectToGoogleSheet()=> ", error);

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

    let newData = {};

    let currentDate = dateFunc.currentUtcTime();
    console.log(currentDate);

    let nextDate;
    if (keywordCheckFrequency === appConstant.keywordCheckFrequency.daily) {
      nextDate = dateFunc.addDate(currentDate, 1, "days");
      nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
      console.log(nextDate);
    } else if (
      keywordCheckFrequency === appConstant.keywordCheckFrequency.weekly
    ) {
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

    newData.keyword = keyword.join();
    newData.domain = domain;
    newData.locationCode = locationCode;
    newData.keywordCheckFrequency = keywordCheckFrequency;
    newData._projectId = _projectId;
    newData.newInserted = true;

    newData.currDate = dateFunc.getAfterMidnightTimeOfDate(currentDate);
    newData.createdAt = currentDate;
    newData.updatedAt = currentDate;

    newData.nextDate = nextDate;

    const subProjectData = await SubProject.create(newData);

    res.status(200).send({
      data: subProjectData,
      message: commonMessage.SUB_PROJECT.ADD_SUB_PROJECT_SUCCESS,
      status: true,
    });

    await updateNewInsertedData();
    // let createTask = await axios({
    //   method: "post",
    //   url: "https://api.dataforseo.com/v3/serp/google/organic/task_post",
    //   auth: {
    //     username: process.env.SERP_API_USERNAME,
    //     password: process.env.SERP_API_PASSWORD,
    //   },
    //   data: [
    //     {
    //       keyword: encodeURI(keyword),
    //       location_code: locationCode,
    //       language_code: "en",
    //       // url: domain,
    //       // depth: "100",
    //       // se_domain: "google.com.au",
    //     },
    //   ],
    //   headers: {
    //     "content-type": "application/json",
    //   },
    // });

    // async function getTask() {
    //   let taskId = createTask.data.tasks[0].id;
    //   console.log(taskId);

    //   let getTaskData = await axios({
    //     method: "get",
    //     url:
    //       "https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/" +
    //       taskId,
    //     auth: {
    //       username: process.env.SERP_API_USERNAME,
    //       password: process.env.SERP_API_PASSWORD,
    //     },
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //   });

    //   let items;
    //   let result;
    //   if (getTaskData.data.tasks) {
    //     items = getTaskData.data.tasks[0].result[0].items;
    //     for (let i of items) {
    //       if (
    //         getTaskData.data.tasks[0].result[0].type == "organic" &&
    //         i.domain == domain
    //       ) {
    //         result = i;
    //       }
    //     }
    //   }

    //   let currentDate = dateFunc.currentUtcTime();
    //   console.log(currentDate);

    //   let nextDate;
    //   if (keywordCheckFrequency === appConstant.keywordCheckFrequency.weekly) {
    //     nextDate = dateFunc.addDate(currentDate, 7, "days");
    //     nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
    //     console.log(nextDate);
    //   } else if (
    //     keywordCheckFrequency === appConstant.keywordCheckFrequency.fortnightly
    //   ) {
    //     nextDate = dateFunc.addDate(currentDate, 15, "days");
    //     nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
    //     console.log(nextDate);
    //   } else {
    //     nextDate = dateFunc.addDate(currentDate, 1, "months");
    //     nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
    //     console.log(nextDate);
    //   }

    //   if (result) {
    //     result.keyword = getTaskData.data.tasks[0].result[0].keyword;
    //     result.seDomain = getTaskData.data.tasks[0].result[0].se_domain;
    //     result.locationCode = getTaskData.data.tasks[0].result[0].location_code;
    //     result.languageCode = getTaskData.data.tasks[0].result[0].language_code;

    //     result.currDate = dateFunc.getAfterMidnightTimeOfDate(currentDate);
    //     result.createdAt = currentDate;
    //     result.updatedAt = currentDate;

    //     result.rankGroup = result.rank_group;
    //     result.rankAbsolute = result.rank_absolute;

    //     result.keywordCheckFrequency = keywordCheckFrequency;
    //     result._projectId = _projectId;
    //     result.nextDate = nextDate;

    //     delete result.rank_group;
    //     delete result.rank_absolute;
    //     console.log(result);

    //     await SubProject.create(result);
    //   } else {
    //     return res.status(400).send({
    //       data: {},
    //       message: commonMessage.TASK.VALID_DOMAIN,
    //       status: false,
    //     });
    //   }

    //}

    // if (createTask.data.status_code === 20000) {
    //   setTimeout(getTask, 8000);
    // }
  } catch (error) {
    console.log("error in addSubProject()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.editSubProject = async (req, res) => {
  try {
    const { keyword } = req.body;
    let _subProjectId = req.params.id;

    let subProjectData = await SubProject.findOne({ _id: _subProjectId });

    subProjectData.newAddedKeyword = keyword.join();
    subProjectData.newInserted = true;
    await subProjectData.save();

    res.status(200).send({
      data: {},
      message: commonMessage.SUB_PROJECT.EDIT_SUB_PROJECT_SUCCESS,
      status: true,
    });

    let keywordList = subProjectData.newAddedKeyword.split(",");

    const promiseResult = Promise.all(
      keywordList.map(async (keyword) => {
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
              location_code: subProjectData.locationCode,
              language_code: "en",
              depth: 100,
              se_domain: "google.com.au",
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
          for (let item of items) {
            if (
              seoData.data.tasks[0].result[0].type == "organic" &&
              item.domain == subProjectData.domain
            ) {
              result = item;
            }
          }
        }

        if (result) {
          result.seDomain = seoData.data.tasks[0].result[0].se_domain;
          result.languageCode = seoData.data.tasks[0].result[0].language_code;
          result.updatedAt = dateFunc.currentUtcTime();
          result.createdAt = dateFunc.currentUtcTime();

          result.rankGroup = result.rank_group;
          result.rankAbsolute = result.rank_absolute;
          result.difference = result.rank_group;
          delete result.rank_group;
          delete result.rank_absolute;

          result.locationCode = subProjectData.locationCode;
          result.prevDate = subProjectData.prevDate;
          result.currDate = subProjectData.currDate;
          result.nextDate = subProjectData.nextDate;
          result.keywordCheckFrequency = subProjectData.keywordCheckFrequency;
          result._projectId = subProjectData._projectId;
          result._subProjectId = subProjectData._id;
          result.keyword = keyword;

          // console.log(result);

          await Keyword.create(result);

          console.log("keywords has been updated >>>");
        } else {
          console.log("Domain and keyword is not match >>>");

          let dataObj = {
            error: true,
            errorMessage: "Domain and keyword is not valid!!!",
          };

          dataObj.locationCode = subProjectData.locationCode;
          dataObj.prevDate = subProjectData.prevDate;
          dataObj.currDate = subProjectData.currDate;
          dataObj.nextDate = subProjectData.nextDate;
          dataObj.keywordCheckFrequency = subProjectData.keywordCheckFrequency;
          dataObj._projectId = subProjectData._projectId;
          dataObj._subProjectId = subProjectData._id;
          dataObj.keyword = keyword;

          dataObj.updatedAt = dateFunc.currentUtcTime();
          dataObj.createdAt = dateFunc.currentUtcTime();

          await Keyword.create(dataObj);
        }
      })
    );

    await SubProject.updateOne(
      { _id: subProjectData._id },
      {
        $set: {
          newInserted: false,
          newAddedKeyword: null,
          keyword: keyword.join().concat(",", subProjectData.keyword),
        },
      }
    );
  } catch (error) {
    console.log("error in editSubProject()=> ", error);

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

    res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.SUB_PROJECT.SUB_PROJECT_FETCH_SUCCESS,
      status: true,
    });

    // await updateNewInsertedData();
  } catch (error) {
    console.log("error in getSubProjectsList()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getSubProjectsDetails = async (req, res) => {
  try {
    let id = req.params.id;

    const subProjectData = await SubProject.findOne({
      _id: id,
    });

    return res.status(200).send({
      data: subProjectData,
      message: commonMessage.SUB_PROJECT.SUB_PROJECT_DETAILS_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getSubProjectsDetails()=> ", error);

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

    await Keyword.deleteMany({
      _subProjectId: id,
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

    const keywordData = await Keyword.find({ _projectId: id, error: null });

    let improvedCount = keywordData.filter(
      (keywords) => keywords.rankGroup > keywords.prevRankGroup
    ).length;
    let declinedCount = keywordData.filter(
      (keywords) => keywords.rankGroup < keywords.prevRankGroup
    ).length;

    let resultObj = {};
    let topSpot = 0;
    let topThree = 0;
    let fourToTen = 0;
    let elevenToTwenty = 0;
    let twentyOneToFifty = 0;
    let fiftyOneToHundred = 0;
    let outOfTopHundred = 0;

    if (keywordData && keywordData.length > 0) {
      for (let i = 0; i < keywordData.length; i++) {
        //top spot
        if (keywordData[i].rankGroup === 1) {
          topSpot = topSpot + 1;
        }

        // top three 1-3
        if (keywordData[i].rankGroup <= 3) {
          topThree = topThree + 1;
        }

        //4 to 10
        if (keywordData[i].rankGroup > 3 && keywordData[i].rankGroup <= 10) {
          fourToTen = fourToTen + 1;
        }

        //11 to 20
        if (keywordData[i].rankGroup > 10 && keywordData[i].rankGroup <= 20) {
          elevenToTwenty = elevenToTwenty + 1;
        }

        //21 to 50
        if (keywordData[i].rankGroup > 20 && keywordData[i].rankGroup <= 50) {
          twentyOneToFifty = twentyOneToFifty + 1;
        }

        //51 to 100
        if (keywordData[i].rankGroup > 50 && keywordData[i].rankGroup <= 100) {
          fiftyOneToHundred = fiftyOneToHundred + 1;
        }

        //100+
        if (keywordData[i].rankGroup > 100) {
          outOfTopHundred = outOfTopHundred + 1;
        }
      }
    }

    const errorKeywordsCount = await Keyword.countDocuments({
      _projectId: id,
      error: true,
    });

    resultObj.totalKeywords = await Keyword.countDocuments({
      _projectId: id,
    });
    resultObj.topSpot = topSpot;
    resultObj.topThree = topThree;
    resultObj.fourToTen = fourToTen;
    resultObj.elevenToTwenty = elevenToTwenty;
    resultObj.twentyOneToFifty = twentyOneToFifty;
    resultObj.fiftyOneToHundred = fiftyOneToHundred;
    resultObj.outOfTopHundred = outOfTopHundred + errorKeywordsCount;
    resultObj.improvedCount = improvedCount;
    resultObj.declinedCount = declinedCount;
    // console.log(resultObj);

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
    const keywordData = await Keyword.find({ error: null });

    let improvedCount = keywordData.filter(
      (keywords) => keywords.rankGroup > keywords.prevRankGroup
    ).length;
    let declinedCount = keywordData.filter(
      (keywords) => keywords.rankGroup < keywords.prevRankGroup
    ).length;

    let resultObj = {};
    let topSpot = 0;
    let topTen = 0;
    let topThirty = 0;
    let topHundred = 0;

    if (keywordData && keywordData.length > 0) {
      for (let i = 0; i < keywordData.length; i++) {
        //top spot
        if (keywordData[i].rankGroup === 1) {
          topSpot = topSpot + 1;
        }
        // top 10
        if (keywordData[i].rankGroup <= 10) {
          topTen = topTen + 1;
        }

        //top 30
        if (keywordData[i].rankGroup <= 30) {
          topThirty = topThirty + 1;
        }

        //top 100
        if (keywordData[i].rankGroup <= 100) {
          topHundred = topHundred + 1;
        }
      }
    }

    resultObj.totalKeywords = await Keyword.countDocuments({});
    resultObj.topSpot = topSpot;
    resultObj.topTen = topTen;
    resultObj.topThirty = topThirty;
    resultObj.topHundred = topHundred;
    resultObj.improvedCount = improvedCount;
    resultObj.declinedCount = declinedCount;

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
    // console.log(subProjectData);

    let subProjectList = [];
    for (let i = 0; i < subProjectData.length; i++) {
      let frequencyType;
      if (
        subProjectData[i].keywordCheckFrequency ===
        appConstant.keywordCheckFrequency.weekly
      ) {
        frequencyType = "Weekly";
      } else if (
        subProjectData[i].keywordCheckFrequency ===
        appConstant.keywordCheckFrequency.fortnightly
      ) {
        frequencyType = "Fortnightly";
      } else {
        frequencyType = "Monthly";
      }

      let location;
      if (
        subProjectData[i].locationCode === appConstant.locationCode.melbourne
      ) {
        location = "Melbourne";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.adelaide
      ) {
        location = "Adelaide";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.sydney
      ) {
        location = "Sydney";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.brisbane
      ) {
        location = "Brisbane";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.perth
      ) {
        location = "Perth";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.canberra
      ) {
        location = "Canberra";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.hobart
      ) {
        location = "Hobart";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.philippines
      ) {
        location = "Philippines";
      }

      const resJson = {};
      resJson["sr"] = i + 1;
      resJson["keywords"] = subProjectData[i].keyword;
      resJson["location"] = location;
      resJson["keywordCheckFrequency"] = frequencyType;
      resJson["domain"] = subProjectData[i].domain;

      subProjectList.push(resJson);
    }

    const fields = [
      { label: "Sr", value: "sr" },
      { label: "Keywords", value: "keywords" },
      { label: "Location", value: "location" },
      { label: "Keyword Check Frequency", value: "keywordCheckFrequency" },
      { label: "Domain", value: "domain" },
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
    console.log("error in exportSubProjectToCsv()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.exportSubProjectToGoogleSheet = async (req, res) => {
  try {
    const id = req.params.id;
    const subProjectData = await SubProject.find({ _projectId: id });

    // if (subProjectData && subProjectData.length > 0) {
    const sheetHeading = [
      ["Sr No", "Keywords", "Location", "Keyword Check Frequency", "Domain"],
    ];
    const sheetTitle = "Sub Project List";
    const defineSheet = "Sheet1!A1:E1";
    const data = await commonFunction.generateGoogleSheet(
      sheetTitle,
      sheetHeading,
      defineSheet
    );

    let sheetId = data.sheetId;

    const accessToken = await commonFunction.refreshToken();

    let sheetBody = [];

    for (let i = 0; i < subProjectData.length; i++) {
      let frequencyType;
      if (
        subProjectData[i].keywordCheckFrequency ===
        appConstant.keywordCheckFrequency.weekly
      ) {
        frequencyType = "Weekly";
      } else if (
        subProjectData[i].keywordCheckFrequency ===
        appConstant.keywordCheckFrequency.fortnightly
      ) {
        frequencyType = "Fortnightly";
      } else {
        frequencyType = "Monthly";
      }

      let location;
      if (
        subProjectData[i].locationCode === appConstant.locationCode.melbourne
      ) {
        location = "Melbourne";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.adelaide
      ) {
        location = "Adelaide";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.sydney
      ) {
        location = "Sydney";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.brisbane
      ) {
        location = "Brisbane";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.perth
      ) {
        location = "Perth";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.canberra
      ) {
        location = "Canberra";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.hobart
      ) {
        location = "Hobart";
      } else if (
        subProjectData[i].locationCode === appConstant.locationCode.philippines
      ) {
        location = "Philippines";
      }
      sheetBody.push([
        `${i + 1}`,
        subProjectData[i].keyword,
        location,
        frequencyType,
        subProjectData[i].domain,
      ]);
    }

    await commonFunction.appendDataInSheet(accessToken, sheetId, sheetBody);

    return res.status(200).send({
      data: data,
      message:
        commonMessage.SUB_PROJECT.SUB_PROJECT_EXPORT_TO_GOOGLE_SHEET_SUCCESS,
      status: true,
    });
    // } else {
    //   return res.status(400).send({
    //     data: {},
    //     message: commonMessage.ERROR_MESSAGE.NO_DATA_FOUND,
    //     status: false,
    //   });
    // }
  } catch (error) {
    console.log("error in exportSubProjectToGoogleSheet()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.getKeywords = async (req, res) => {
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

    let query = { _subProjectId: id };

    const result = await Keyword.find(query, projection)
      .collation({ locale: "en" })
      .sort({ [field]: value })
      .skip(limit * (page - 1))
      .limit(limit)
      .lean();

    let total = await Keyword.countDocuments(query);

    return res.status(200).send({
      data: { result, total, limit, page },
      message: commonMessage.KEYWORD.KEYWORD_FETCH_SUCCESS,
      status: true,
    });
  } catch (error) {
    console.log("error in getKeywords()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.exportKeywordsToCsv = async (req, res) => {
  try {
    const id = req.params.id;
    const keywordsData = await Keyword.find({ _subProjectId: id });

    let keywordList = [];
    for (let i = 0; i < keywordsData.length; i++) {
      const resJson = {};
      resJson["sr"] = i + 1;
      resJson["keywords"] = keywordsData[i].keyword;
      resJson["previousRanking"] = keywordsData[i].prevRankGroup;
      resJson["currentRanking"] = keywordsData[i].rankGroup;
      resJson["difference"] = keywordsData[i].difference;
      resJson["url"] = keywordsData[i].url;

      keywordList.push(resJson);
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
    const csv = json2csvParser.parse(keywordList);

    const keywordsCSVFile = `${process.env.REPORTS_PATH}/keywordsCSVFile.csv`;

    fs.writeFile(keywordsCSVFile, csv, function (err) {
      if (err) throw err;
    });
    function myFunc() {
      res.download(keywordsCSVFile);
    }

    setTimeout(() => {
      myFunc();
    }, 2000);
    return;
  } catch (error) {
    console.log("error in exportKeywordsToCsv()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.exportKeywordsToGoogleSheet = async (req, res) => {
  try {
    const id = req.params.id;
    const keywordsData = await Keyword.find({ _subProjectId: id });

    // if (subProjectData && subProjectData.length > 0) {
    const sheetHeading = [
      [
        "Sr No",
        "Keywords",
        "Previous ranking",
        "Current ranking",
        "Difference",
        "URL",
      ],
    ];
    const sheetTitle = "Keyword List";
    const defineSheet = "Sheet1!A1:F1";
    const data = await commonFunction.generateGoogleSheet(
      sheetTitle,
      sheetHeading,
      defineSheet
    );

    let sheetId = data.sheetId;

    const accessToken = await commonFunction.refreshToken();

    let sheetBody = [];

    for (let i = 0; i < keywordsData.length; i++) {
      sheetBody.push([
        `${i + 1}`,
        keywordsData[i].keyword,
        keywordsData[i].prevRankGroup,
        keywordsData[i].rankGroup,
        keywordsData[i].difference,
        keywordsData[i].url,
      ]);
    }

    await commonFunction.appendDataInSheet(accessToken, sheetId, sheetBody);

    return res.status(200).send({
      data: data,
      message: commonMessage.KEYWORD.KEYWORD_EXPORT_TO_GOOGLE_SHEET_SUCCESS,
      status: true,
    });
    // } else {
    //   return res.status(400).send({
    //     data: {},
    //     message: commonMessage.ERROR_MESSAGE.NO_DATA_FOUND,
    //     status: false,
    //   });
    // }
  } catch (error) {
    console.log("error in exportKeywordsToGoogleSheet()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.keywordDashboard = async (req, res) => {
  try {
    let id = req.params.id;
    const keywordsData = await Keyword.find({ _subProjectId: id, error: null });

    let improvedCount = keywordsData.filter(
      (keywords) => keywords.rankGroup > keywords.prevRankGroup
    ).length;
    let declinedCount = keywordsData.filter(
      (keywords) => keywords.rankGroup < keywords.prevRankGroup
    ).length;

    let resultObj = {};
    let topSpot = 0;
    let topThree = 0;
    let fourToTen = 0;
    let elevenToTwenty = 0;
    let twentyOneToFifty = 0;
    let fiftyOneToHundred = 0;
    let outOfTopHundred = 0;

    if (keywordsData && keywordsData.length > 0) {
      for (let i = 0; i < keywordsData.length; i++) {
        //top spot
        if (keywordsData[i].rankGroup === 1) {
          topSpot = topSpot + 1;
        }

        // top three 1-3
        if (keywordsData[i].rankGroup <= 3) {
          topThree = topThree + 1;
        }

        //4 to 10
        if (keywordsData[i].rankGroup > 3 && keywordsData[i].rankGroup <= 10) {
          fourToTen = fourToTen + 1;
        }

        //11 to 20
        if (keywordsData[i].rankGroup > 10 && keywordsData[i].rankGroup <= 20) {
          elevenToTwenty = elevenToTwenty + 1;
        }

        //21 to 50
        if (keywordsData[i].rankGroup > 20 && keywordsData[i].rankGroup <= 50) {
          twentyOneToFifty = twentyOneToFifty + 1;
        }

        //51 to 100
        if (
          keywordsData[i].rankGroup > 50 &&
          keywordsData[i].rankGroup <= 100
        ) {
          fiftyOneToHundred = fiftyOneToHundred + 1;
        }

        //100+
        if (keywordsData[i].rankGroup > 100) {
          outOfTopHundred = outOfTopHundred + 1;
        }
      }
    }

    const errorKeywordsCount = await Keyword.countDocuments({
      _subProjectId: id,
      error: true,
    });

    resultObj.totalKeywords = await Keyword.countDocuments({
      _subProjectId: id,
    });
    resultObj.topSpot = topSpot;
    resultObj.topThree = topThree;
    resultObj.fourToTen = fourToTen;
    resultObj.elevenToTwenty = elevenToTwenty;
    resultObj.twentyOneToFifty = twentyOneToFifty;
    resultObj.fiftyOneToHundred = fiftyOneToHundred;
    resultObj.outOfTopHundred = outOfTopHundred + errorKeywordsCount;
    resultObj.improvedCount = improvedCount;
    resultObj.declinedCount = declinedCount;

    // console.log(resultObj);

    return res.status(200).send({
      data: resultObj,
      message: commonMessage.KEYWORD.KEYWORD_ANALYTICAL_DATA_SUCCESS,
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

const updateNewInsertedData = async () => {
  try {
    const newData = await SubProject.find({ newInserted: true });

    newData.forEach(async (data) => {
      let keywordList = data.keyword.split(",");

      const promiseResult = Promise.all(
        keywordList.map(async (keyword) => {
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
                location_code: data.locationCode,
                language_code: "en",
                depth: 100,
                se_domain: "google.com.au",
              },
            ],
            headers: {
              "content-type": "application/json",
            },
          });

          let items;
          let result;
          // console.log(seoData.data.tasks);

          if (seoData.data.tasks) {
            items = seoData.data.tasks[0].result[0].items;
            for (let item of items) {
              if (
                seoData.data.tasks[0].result[0].type == "organic" &&
                item.domain == data.domain
              ) {
                result = item;
              }
            }
          }

          if (result) {
            result.seDomain = seoData.data.tasks[0].result[0].se_domain;
            result.languageCode = seoData.data.tasks[0].result[0].language_code;
            result.updatedAt = dateFunc.currentUtcTime();
            result.createdAt = dateFunc.currentUtcTime();

            result.rankGroup = result.rank_group;
            result.rankAbsolute = result.rank_absolute;
            result.difference = result.rank_group;

            delete result.rank_group;
            delete result.rank_absolute;

            result.locationCode = data.locationCode;
            result.prevDate = data.prevDate;
            result.currDate = data.currDate;
            result.nextDate = data.nextDate;
            result.keywordCheckFrequency = data.keywordCheckFrequency;
            result._projectId = data._projectId;
            result._subProjectId = data._id;
            result.keyword = keyword;

            // console.log(result);

            await Keyword.create(result);

            console.log("keywords has been updated >>>");
          } else {
            console.log("Domain and keyword is not match >>>");

            let dataObj = {
              error: true,
              errorMessage: "Domain and keyword is not valid!!!",
            };

            dataObj.locationCode = data.locationCode;
            dataObj.prevDate = data.prevDate;
            dataObj.currDate = data.currDate;
            dataObj.nextDate = data.nextDate;
            dataObj.keywordCheckFrequency = data.keywordCheckFrequency;
            dataObj._projectId = data._projectId;
            dataObj._subProjectId = data._id;
            dataObj.keyword = keyword;

            dataObj.updatedAt = dateFunc.currentUtcTime();
            dataObj.createdAt = dateFunc.currentUtcTime();

            await Keyword.create(dataObj);
          }
        })
      ).catch((error) => console.log(error));

      await SubProject.updateOne(
        { _id: data._id },
        { $set: { newInserted: false } }
      );
    });

    //Using async await
    // const newData = await SubProject.find({ newInserted: true });
    // console.log(newData);
    // // process.exit(1);
    // if (newData && newData.length > 0) {
    //   for (let i = 0; i < newData.length; i++) {
    //     console.log(newData[i].keyword.split(","));

    //     let keywordArr = newData[i].keyword.split(",");

    //     for (let j = 0; j < keywordArr.length; j++) {
    //       let seoData = await axios({
    //         method: "post",
    //         url: process.env.SERP_API,
    //         auth: {
    //           username: process.env.SERP_API_USERNAME,
    //           password: process.env.SERP_API_PASSWORD,
    //         },
    //         data: [
    //           {
    //             keyword: encodeURI(keywordArr[j]),
    //             location_code: newData[i].locationCode,
    //             language_code: "en",
    //           },
    //         ],
    //         headers: {
    //           "content-type": "application/json",
    //         },
    //       });

    //       let items;
    //       let result;
    //       console.log(seoData.data.tasks);

    //       if (seoData.data.tasks) {
    //         items = seoData.data.tasks[0].result[0].items;
    //         for (let item of items) {
    //           if (
    //             seoData.data.tasks[0].result[0].type == "organic" &&
    //             item.domain == newData[i].domain
    //           ) {
    //             result = item;
    //           }
    //         }
    //       }

    //       if (result) {
    //         result.seDomain = seoData.data.tasks[0].result[0].se_domain;
    //         result.languageCode = seoData.data.tasks[0].result[0].language_code;
    //         result.updatedAt = dateFunc.currentUtcTime();
    //         result.createdAt = dateFunc.currentUtcTime();

    //         result.rankGroup = result.rank_group;
    //         result.rankAbsolute = result.rank_absolute;
    //         delete result.rank_group;
    //         delete result.rank_absolute;

    //         result.locationCode = newData[i].locationCode;
    //         result.prevDate = newData[i].prevDate;
    //         result.currDate = newData[i].currDate;
    //         result.nextDate = newData[i].nextDate;
    //         result.keywordCheckFrequency = newData[i].keywordCheckFrequency;
    //         result._projectId = newData[i]._projectId;
    //         result._subProjectId = newData[i]._id;
    //         result.keyword = keywordArr[j];

    //         console.log(result);

    //         await Keyword.create(result);

    //         console.log("keywords has been updated >>>");
    //       } else {
    //         console.log("Domain and keyword is not match >>>");

    //         let data = {
    //           error: true,
    //           errorMessage: "Domain and keyword is not valid!!!",
    //         };

    //         data.locationCode = newData[i].locationCode;
    //         data.prevDate = newData[i].prevDate;
    //         data.currDate = newData[i].currDate;
    //         data.nextDate = newData[i].nextDate;
    //         data.keywordCheckFrequency = newData[i].keywordCheckFrequency;
    //         data._projectId = newData[i]._projectId;
    //         data._subProjectId = newData[i]._id;
    //         data.keyword = keywordArr[j];

    //         data.updatedAt = dateFunc.currentUtcTime();
    //         data.createdAt = dateFunc.currentUtcTime();

    //         await Keyword.create(data);
    //         // await SubProject.updateOne(
    //         //   { _id: newData[i]._id },
    //         //   {
    //         //     $set: {
    //         //       newInserted: false,
    //         //       error: true,
    //         //       errorMessage: "Domain and keyword is not valid!!!",
    //         //     },
    //         //   }
    //         // );
    //       }
    //       await SubProject.updateOne(
    //         { _id: newData[i]._id },
    //         { $set: { newInserted: false } }
    //       );
    //     }
    //   }
    // } else {
    //   console.log("New data not found!!!");
    // }

    // await SubProject.updateOne(
    //   { _id: newData[i]._id },
    //   { $set: { newInserted: false } }
    // );
  } catch (error) {
    console.log("Error in update new inserted data function" + error);
  }
};

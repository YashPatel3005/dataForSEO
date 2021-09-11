const _ = require("lodash");
const axios = require("axios");

const commonMessage = require("../../helpers/commonMessage.helper");
const dateFunc = require("../../helpers/dateFunctions.helper");

const Admin = require("../../models/admin.model");
const Project = require("../../models/project.model");
const SubProject = require("../../models/subProject.model");

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

    //PENDING
    //here we have deleted only project and if sub project exists under that project we also have to delete all sub project

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

      if (result) {
        result.keyword = getTaskData.data.tasks[0].result[0].keyword;
        result.seDomain = getTaskData.data.tasks[0].result[0].se_domain;
        result.locationCode = getTaskData.data.tasks[0].result[0].location_code;
        result.languageCode = getTaskData.data.tasks[0].result[0].language_code;
        result.date = dateFunc.getAfterMidnightTimeOfDate(
          dateFunc.currentUtcTime()
        );
        result.createdAt = dateFunc.currentUtcTime();

        result.rankGroup = result.rank_group;
        result.rankAbsolute = result.rank_absolute;

        result.keywordCheckFrequency = keywordCheckFrequency;
        result._projectId = _projectId;

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

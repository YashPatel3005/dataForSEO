const express = require("express");
const router = express.Router();

const {
  login,
  createUser,
  addProject,
  editProject,
  viewProject,
  deleteProject,
  getProjectsList,
  addSubProject,
  getProjectsListDrpDwn,
  getSubProjectsList,
  deleteSubProject,
  subProjectDashboard,
  projectDashboard,
  exportSubProjectToCsv,
  exportProjectToCsv,
  exportProjectToGoogleSheet,
  exportSubProjectToGoogleSheet,
  getKeywords,
  exportKeywordsToCsv,
  exportKeywordsToGoogleSheet,
  keywordDashboard,
  getSubProjectsDetails,
  editSubProject,
} = require("../controllers/admin.controller");

const {
  loginValidator,
  projectValidator,
} = require("../../validators/admin.validator");

const { validatorFunc } = require("../../helpers/commonFunction.helper");

router.post("/login", loginValidator, validatorFunc, login);

// router.post(
//   "/createUser",
//   authenticate,
//   userValidator,
//   validatorFunc,
//   createUser
// );

//Project
router.post("/addProject", projectValidator, validatorFunc, addProject);

router.put("/editProject/:id", projectValidator, validatorFunc, editProject);

router.delete("/deleteProject/:id", deleteProject);

router.get("/viewProject/:id", viewProject);

router.get("/projectList", getProjectsList);

router.get("/projectDashboard", projectDashboard);

router.get("/exportProjectToCsv", exportProjectToCsv);

router.get("/exportProjectToGoogleSheet", exportProjectToGoogleSheet);

//get Project list for dropdown
router.get("/getProjectsListDrpDwn", getProjectsListDrpDwn);

//Sub Project
router.post("/addSubProject", addSubProject);

router.post("/editSubProject/:id", editSubProject);

router.get("/getSubProjectsList/:id", getSubProjectsList);

router.get("/getSubProjectsDetails/:id", getSubProjectsDetails);

router.delete("/deleteSubProject/:id", deleteSubProject);

router.get("/subProjectDashboard/:id", subProjectDashboard);

router.get("/exportSubProjectToCsv/:id", exportSubProjectToCsv);

router.get("/exportSubProjectToGoogleSheet/:id", exportSubProjectToGoogleSheet);

//Keyword
router.get("/getKeywords/:id", getKeywords);

router.get("/keywordDashboard/:id", keywordDashboard);

router.get("/exportKeywordsToCsv/:id", exportKeywordsToCsv);

router.get("/exportKeywordsToGoogleSheet/:id", exportKeywordsToGoogleSheet);

module.exports = router;

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

router.post("/addSubProject", addSubProject);

router.get("/getSubProjectsList/:id", getSubProjectsList);

router.delete("/deleteSubProject/:id", deleteSubProject);

router.get("/subProjectDashboard/:id", subProjectDashboard);

router.get("/exportSubProjectToCsv/:id", exportSubProjectToCsv);

router.get("/exportSubProjectToGoogleSheet/:id", exportSubProjectToGoogleSheet);
module.exports = router;

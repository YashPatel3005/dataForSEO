const express = require("express");
const router = express.Router();

const {
  login,
  createUser,
  deleteUser,
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
  getViewUserProfile,
  changePassword,
  getUserList,
  editUser,
  forgotPassword,
  deleteKeywords,
  addTag,
  enableDisableEmailNotification,
  tagList,
  tagListDropDown,
  deleteTag,
  keywordsForTags,
  keywordGraph,
  keywordsOfTagsGraph,
  allTagsCombineGraph,
  removeTag,
} = require("../controllers/admin.controller");

const {
  loginValidator,
  projectValidator,
  userValidator,
  forgotPasswordValidator,
} = require("../../validators/admin.validator");

const { validatorFunc } = require("../../helpers/commonFunction.helper");

const { authenticate } = require("../../middleware/auth.middleware");

router.post("/login", loginValidator, validatorFunc, login);

//User
router.post(
  "/createUser",
  authenticate,
  userValidator,
  validatorFunc,
  createUser
);

router.delete("/deleteUser/:id", authenticate, deleteUser);

router.get("/viewUserProfile/:id", authenticate, getViewUserProfile);

router.post("/changePassword", authenticate, changePassword);

router.post(
  "/forgotPassword",
  forgotPasswordValidator,
  validatorFunc,
  forgotPassword
);

router.get("/getUserList", authenticate, getUserList);

router.put("/editUser/:id", authenticate, editUser);

//Project
router.post(
  "/addProject",
  authenticate,
  projectValidator,
  validatorFunc,
  addProject
);

router.put(
  "/editProject/:id",
  authenticate,
  projectValidator,
  validatorFunc,
  editProject
);

router.delete("/deleteProject/:id", authenticate, deleteProject);

router.get("/viewProject/:id", authenticate, viewProject);

router.get("/projectList", authenticate, getProjectsList);

router.get("/projectDashboard", authenticate, projectDashboard);

router.get("/exportProjectToCsv", authenticate, exportProjectToCsv);

router.get(
  "/exportProjectToGoogleSheet",
  authenticate,
  exportProjectToGoogleSheet
);

//get Project list for dropdown
router.get("/getProjectsListDrpDwn", authenticate, getProjectsListDrpDwn);

//Sub Project
router.post("/addSubProject", authenticate, addSubProject);

router.post("/editSubProject/:id", authenticate, editSubProject);

router.get("/getSubProjectsList/:id", authenticate, getSubProjectsList);

router.get("/getSubProjectsDetails/:id", authenticate, getSubProjectsDetails);

router.delete("/deleteSubProject/:id", authenticate, deleteSubProject);

router.get("/subProjectDashboard/:id", authenticate, subProjectDashboard);

router.get("/exportSubProjectToCsv/:id", authenticate, exportSubProjectToCsv);

router.get(
  "/exportSubProjectToGoogleSheet/:id",
  authenticate,
  exportSubProjectToGoogleSheet
);

router.put(
  "/enableDisableEmailNotification",
  authenticate,
  enableDisableEmailNotification
);

//Keyword
router.get("/getKeywords/:id", authenticate, getKeywords);

router.get("/keywordDashboard/:id", authenticate, keywordDashboard);

router.get("/exportKeywordsToCsv/:id", authenticate, exportKeywordsToCsv);

router.get(
  "/exportKeywordsToGoogleSheet/:id",
  authenticate,
  exportKeywordsToGoogleSheet
);

router.delete("/deleteKeywords", authenticate, deleteKeywords);

//Tags
router.post("/addTag/:id", authenticate, addTag);

router.post("/removeTag", authenticate, removeTag);

router.get("/tagList/:id", authenticate, tagList);

router.get("/tagListDropDown/:id", authenticate, tagListDropDown);

router.delete("/deleteTag/:id", authenticate, deleteTag);

router.get("/keywordsForTags/:id", authenticate, keywordsForTags);

router.get("/keywordGraph/:id", authenticate, keywordGraph);

router.get("/keywordsOfTagsGraph/:id", authenticate, keywordsOfTagsGraph);

router.get("/allTagsCombineGraph/:id", authenticate, allTagsCombineGraph);

module.exports = router;

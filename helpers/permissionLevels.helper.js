module.exports = (permissionLevel, route) => {
  const permissionObj = {
    /* ADMIN */
    1: [],

    /* TEAM */
    2: [
      "/createUser",
      "/deleteUser/:id",
      //   "/viewUserProfile/:id",
      //   "/changePassword",
      "/getUserList",
      //   "/editUser/:id",
    ],

    /* CLIENT */
    3: [
      "/createUser",
      "/deleteUser/:id",
      //   "/viewUserProfile/:id",
      //   "/changePassword",
      "/getUserList",
      //   "/editUser/:id",
      "/addProject",
      "/editProject/:id",
      "/deleteProject/:id",
      "/exportProjectToCsv",
      "/exportProjectToGoogleSheet",
      "/addSubProject",
      "/editSubProject/:id",
      "/deleteSubProject/:id",
      "/exportSubProjectToCsv/:id",
      "/exportSubProjectToGoogleSheet/:id",
      "/exportKeywordsToCsv/:id",
      "/exportKeywordsToGoogleSheet/:id",
      "/deleteKeywords",
      "/enableDisableEmailNotification",
      "/addTag",
      "/deleteTag/:id",
    ],
  };

  if (permissionLevel == 1) {
    return true;
  } else if (permissionLevel == 2) {
    const isPermitted = permissionObj[permissionLevel].includes(route);

    if (isPermitted == true) {
      return false;
    } else {
      return true;
    }
  } else if (permissionLevel == 3) {
    const isPermitted = permissionObj[permissionLevel].includes(route);

    if (isPermitted == true) {
      return false;
    } else {
      return true;
    }
  }
};

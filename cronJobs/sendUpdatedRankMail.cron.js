const CronJob = require("cron").CronJob;

const SubProject = require("../models/subProject.model");
const Keyword = require("../models/keywords.model");
const Project = require("../models/project.model");
const Admin = require("../models/admin.model");
const dateFunc = require("../helpers/dateFunctions.helper");
const appConstant = require("../app.constant");

const sendEmail = require("../services/email.service");
const newRankUpdateTemplate = require("../services/emailTemplates/newRankUpdateTemplate");

//send updated rank mail daily at 03:00 UTC
const sendUpdatedRankMail = new CronJob({
  cronTime: "00 03 * * *",
  onTick: async () => {
    if (sendUpdatedRankMail.taskRunning) {
      return;
    }
    sendUpdatedRankMail.taskRunning = true;

    try {
      console.log("SEND MAIL CRON");
      let currentDate = dateFunc.currentUtcTime();
      currentDate = dateFunc.getAfterMidnightTimeOfDate(currentDate);
      console.log(currentDate);

      let subProjectList = await SubProject.find({ updatedAt: currentDate });
      console.log("subProjectList >>> " + subProjectList.length);

      for (let i = 0; i < subProjectList.length; i++) {
        if (subProjectList[i].enableEmail === true) {
          const keywordData = await Keyword.find({
            _subProjectId: subProjectList[i]._id,
            error: null,
          });
          console.log(keywordData.length);

          const errorKeywordsCount = await Keyword.countDocuments({
            _subProjectId: subProjectList[i]._id,
            error: true,
          });

          let improvedCount = keywordData.filter(
            (keywords) =>
              keywords.prevRankGroup !== null &&
              keywords.rankGroup < keywords.prevRankGroup
          ).length;
          let declinedCount = keywordData.filter(
            (keywords) =>
              keywords.prevRankGroup !== null &&
              keywords.rankGroup > keywords.prevRankGroup
          ).length;

          let topSpot = 0;
          let topTen = 0;
          let aboveHundred = 0;

          if (keywordData && keywordData.length > 0) {
            for (let j = 0; j < keywordData.length; j++) {
              //top spot
              if (keywordData[j].rankGroup === 1) {
                topSpot = topSpot + 1;
              }

              // top 10
              if (keywordData[j].rankGroup <= 10) {
                topTen = topTen + 1;
              }

              //Above 100
              if (keywordData[j].rankGroup > 100) {
                aboveHundred = aboveHundred + 1;
              }
            }
          }
          aboveHundred = aboveHundred + errorKeywordsCount;
          console.log("topSpot" + topSpot);
          console.log("topTen" + topTen);
          console.log("aboveHundred" + aboveHundred);
          console.log("improvedCount" + improvedCount);
          console.log("declinedCount" + declinedCount);

          //Email Subject
          let locationArr = appConstant.locationArray;

          let foundLocation = locationArr.find((locationData) => {
            if (locationData.locationCode === subProjectList[i].locationCode) {
              return true;
            }
          });

          let emailSubject;

          const projectData = await Project.findOne({
            _id: subProjectList[i]._projectId,
          });

          if (projectData && projectData.assignedUsers.length > 0) {
            for (let k = 0; k < projectData.assignedUsers.length; k++) {
              const user = await Admin.findOne({
                _id: projectData.assignedUsers[k],
              });

              let firstName = user.firstName;
              let email = user.email;
              let subProjectName = projectData.projectName;
              let viewSubProjectUrl =
                process.env.VIEW_SUB_PROJECT_URL +
                subProjectList[i]._projectId +
                "/keyword/" +
                subProjectList[i]._id;

              emailSubject = `${subProjectName} - ${foundLocation.locationName} - Ranking Update`;

              await sendEmail(
                email,
                emailSubject,
                newRankUpdateTemplate(
                  topSpot,
                  topTen,
                  aboveHundred,
                  improvedCount,
                  declinedCount,
                  firstName,
                  subProjectName,
                  viewSubProjectUrl
                )
              );
            }
          }

          //Send mail to main Admin
          const admin = await Admin.findOne({
            permissionLevel: appConstant.adminPermissionLevel.admin,
          });

          let firstName = admin.firstName;
          let email = admin.email;
          let subProjectName = projectData.projectName;
          let viewSubProjectUrl =
            process.env.VIEW_SUB_PROJECT_URL +
            subProjectList[i]._projectId +
            "/keyword/" +
            subProjectList[i]._id;
          emailSubject = `${subProjectName} - ${foundLocation.locationName} - Ranking Update`;

          await sendEmail(
            email,
            emailSubject,
            newRankUpdateTemplate(
              topSpot,
              topTen,
              aboveHundred,
              improvedCount,
              declinedCount,
              firstName,
              subProjectName,
              viewSubProjectUrl
            )
          );
        }
      }
    } catch (error) {
      console.log("error in sendUpdatedRankMail.cron =>", error);
    }
    sendUpdatedRankMail.taskRunning = false;
  },
  start: true,
});

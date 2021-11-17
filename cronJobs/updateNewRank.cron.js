const CronJob = require("cron").CronJob;
const axios = require("axios");

const SubProject = require("../models/subProject.model");
const Keyword = require("../models/keywords.model");
const KeywordHistory = require("../models/keywordHistory.model");
const dateFunc = require("../helpers/dateFunctions.helper");
const appConstant = require("../app.constant");

//update new rank at 00:00 AM
const updateNewRank = new CronJob({
  cronTime: "50 00 * * *",
  onTick: async () => {
    if (updateNewRank.taskRunning) {
      return;
    }
    updateNewRank.taskRunning = true;

    try {
      console.log("inside updateNewRank cron =>");

      let currentDate = dateFunc.currentUtcTime();
      currentDate = dateFunc.getAfterMidnightTimeOfDate(currentDate);
      console.log(currentDate);

      const subProjectList = await SubProject.find({ nextDate: currentDate });
      console.log("subProjectList >>> " + subProjectList.length);

      subProjectList.forEach(async (data) => {
        const keywords = await Keyword.find({
          _subProjectId: data._id,
        });
        console.log("keywords >>>" + keywords.length);

        let nextDate;
        if (
          data.keywordCheckFrequency === appConstant.keywordCheckFrequency.daily
        ) {
          nextDate = dateFunc.addDate(currentDate, 1, "days");
          nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
          console.log(nextDate);
        } else if (
          data.keywordCheckFrequency ===
          appConstant.keywordCheckFrequency.weekly
        ) {
          nextDate = dateFunc.addDate(currentDate, 7, "days");
          nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
          console.log(nextDate);
        } else if (
          data.keywordCheckFrequency ===
          appConstant.keywordCheckFrequency.fortnightly
        ) {
          nextDate = dateFunc.addDate(currentDate, 15, "days");
          nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
          console.log(nextDate);
        } else {
          nextDate = dateFunc.addDate(currentDate, 1, "months");
          nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
          console.log(nextDate);
        }

        const promiseResult = Promise.all(
          keywords.map(async (keyword) => {
            // const keyword = keyword.keyword;
            const locationCode = keyword.locationCode;
            const languageCode = keyword.languageCode;
            const domain = keyword.domain;

            let seoData = await axios({
              method: "post",
              url: process.env.SERP_API,
              auth: {
                username: process.env.SERP_API_USERNAME,
                password: process.env.SERP_API_PASSWORD,
              },
              data: [
                {
                  keyword: encodeURI(keyword.keyword),
                  location_code: locationCode,
                  language_code: languageCode,
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
                  item.domain == domain
                ) {
                  result = item;
                }
              }
            }

            if (result) {
              let newObj = {};

              newObj.rankGroup = result.rank_group;
              newObj.rankAbsolute = result.rank_absolute;

              newObj.prevDate = keyword.currDate;
              newObj.prevRankAbsolute = keyword.rankAbsolute;
              newObj.prevRankGroup = keyword.rankGroup;
              newObj.difference = newObj.rankGroup - newObj.prevRankGroup;

              newObj.currDate = currentDate;
              newObj.nextDate = nextDate;

              newObj.updatedAt = dateFunc.currentUtcTime();
              // console.log(newObj);

              const keywordHistoryData = await KeywordHistory.findOne({
                _keywordId: keyword._id,
              });

              if (keywordHistoryData) {
                const isExists = keywordHistoryData.keywordData.find(
                  (items) => items.date.toString() == currentDate.toString()
                );

                if (!isExists) {
                  keywordHistoryData.updatedAt = dateFunc.currentUtcTime();
                  keywordHistoryData.keywordData.push({
                    date: currentDate,
                    rank: newObj.rankGroup,
                  });

                  await keywordHistoryData.save();
                }
              }

              await Keyword.updateOne({ _id: keyword._id }, { $set: newObj });

              console.log("keywords has been updated >>>");
            }
          })
        );
        let subProjectObj = {};
        subProjectObj.prevDate = data.currDate;
        subProjectObj.currDate = currentDate;
        subProjectObj.nextDate = nextDate;
        subProjectObj.updatedAt = currentDate;

        await SubProject.updateOne({ _id: data._id }, { $set: subProjectObj });
        // .then(async () => {
        //   let subProjectObj = {};
        //   subProjectObj.prevDate = data.currDate;
        //   subProjectObj.currDate = currentDate;
        //   subProjectObj.nextDate = nextDate;
        //   subProjectObj.updatedAt = dateFunc.currentUtcTime();

        //   await SubProject.updateOne(
        //     { _id: data._id },
        //     { $set: subProjectObj }
        //   );

        //   console.log("SEND EMAIL >>>");
        //   if (data.enableEmail === true) {
        //     const keywordData = await Keyword.find({
        //       _projectId: data._projectId,
        //       error: null,
        //     });

        //     // let improvedCount = keywordData.filter(
        //     //   (keywords) => keywords.rankGroup > keywords.prevRankGroup
        //     // ).length;
        //     // let declinedCount = keywordData.filter(
        //     //   (keywords) => keywords.rankGroup < keywords.prevRankGroup
        //     // ).length;
        //     let improvedCount = keywordData.filter(
        //       (keywords) =>
        //         keywords.prevRankGroup !== null &&
        //         keywords.rankGroup < keywords.prevRankGroup
        //     ).length;
        //     let declinedCount = keywordData.filter(
        //       (keywords) =>
        //         keywords.prevRankGroup !== null &&
        //         keywords.rankGroup > keywords.prevRankGroup
        //     ).length;

        //     let topSpot = 0;
        //     let topTen = 0;
        //     let aboveHundred = 0;

        //     if (keywordData && keywordData.length > 0) {
        //       for (let i = 0; i < keywordData.length; i++) {
        //         //top spot
        //         if (keywordData[i].rankGroup === 1) {
        //           topSpot = topSpot + 1;
        //         }

        //         // top 10
        //         if (keywordData[i].rankGroup <= 10) {
        //           topTen = topTen + 1;
        //         }

        //         //Above 100
        //         if (keywordData[i].rankGroup > 100) {
        //           aboveHundred = aboveHundred + 1;
        //         }
        //       }
        //     }
        //     console.log("topSpot" + topSpot);
        //     console.log("topTen" + topTen);
        //     console.log("aboveHundred" + aboveHundred);
        //     console.log("improvedCount" + improvedCount);
        //     console.log("declinedCount" + declinedCount);

        //     //Email Subject
        //     let locationArr = appConstant.locationArray;

        //     let foundLocation = locationArr.find((locationData) => {
        //       if (locationData.locationCode === data.locationCode) {
        //         return true;
        //       }
        //     });

        //     let emailSubject;

        //     const projectData = await Project.findOne({
        //       _id: data._projectId,
        //     });

        //     if (projectData && projectData.assignedUsers.length > 0) {
        //       for (let i = 0; i < projectData.assignedUsers.length; i++) {
        //         const user = await Admin.findOne({
        //           _id: projectData.assignedUsers[i],
        //         });

        //         let firstName = user.firstName;
        //         let email = user.email;
        //         let subProjectName = projectData.projectName;
        //         let viewSubProjectUrl =
        //           process.env.VIEW_SUB_PROJECT_URL + data._projectId;
        //         emailSubject = `${subProjectName} - ${foundLocation.locationName} - Ranking Update`;

        //         await sendEmail(
        //           email,
        //           emailSubject,
        //           newRankUpdateTemplate(
        //             topSpot,
        //             topTen,
        //             aboveHundred,
        //             improvedCount,
        //             declinedCount,
        //             firstName,
        //             subProjectName,
        //             viewSubProjectUrl
        //           )
        //         );
        //       }
        //     }

        //     //Send mail to main Admin
        //     const admin = await Admin.findOne({
        //       permissionLevel: appConstant.adminPermissionLevel.admin,
        //     });

        //     let firstName = admin.firstName;
        //     let email = admin.email;
        //     let subProjectName = projectData.projectName;
        //     let viewSubProjectUrl =
        //       process.env.VIEW_SUB_PROJECT_URL + data._projectId;
        //     emailSubject = `${subProjectName} - ${foundLocation.locationName} - Ranking Update`;

        //     await sendEmail(
        //       email,
        //       emailSubject,
        //       newRankUpdateTemplate(
        //         topSpot,
        //         topTen,
        //         aboveHundred,
        //         improvedCount,
        //         declinedCount,
        //         firstName,
        //         subProjectName,
        //         viewSubProjectUrl
        //       )
        //     );
        //   }
        // })
        // .catch((error) => {
        //   console.log("error" + error);
        // });
      });
    } catch (error) {
      console.log("error in updateNewRank.cron =>", error);
    }
    updateNewRank.taskRunning = false;
  },
  start: true,
  timeZone: "Asia/Kolkata",
});

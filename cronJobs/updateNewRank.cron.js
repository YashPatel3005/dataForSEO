const CronJob = require("cron").CronJob;
const axios = require("axios");

const SubProject = require("../models/subProject.model");
const Keyword = require("../models/keywords.model");
const dateFunc = require("../helpers/dateFunctions.helper");
const appConstant = require("../app.constant");

//update new rank at 00:00 AM
const updateNewRank = new CronJob({
  cronTime: "00 00 * * *",
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
      console.log(subProjectList);

      if (subProjectList && subProjectList.length > 0) {
        for (let i = 0; i < subProjectList.length; i++) {
          const keywords = await Keyword.find({
            _subProjectId: subProjectList[i]._id,
          });

          let nextDate;
          if (
            subProjectList[i].keywordCheckFrequency ===
            appConstant.keywordCheckFrequency.weekly
          ) {
            nextDate = dateFunc.addDate(currentDate, 7, "days");
            nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
            console.log(nextDate);
          } else if (
            subProjectList[i].keywordCheckFrequency ===
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

          for (let k = 0; k < keywords.length; k++) {
            const keyword = keywords[k].keyword;
            const locationCode = keywords[k].locationCode;
            const languageCode = keywords[k].languageCode;
            const domain = keywords[k].domain;

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
                  language_code: languageCode,
                },
              ],
              headers: {
                "content-type": "application/json",
              },
            });

            let items;
            let result;
            console.log(seoData.data.tasks);
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

              newObj.prevDate = keywords[k].currDate;
              newObj.prevRankAbsolute = keywords[k].rankAbsolute;

              newObj.currDate = currentDate;
              newObj.nextDate = nextDate;

              newObj.updatedAt = dateFunc.currentUtcTime();
              console.log(newObj);

              await Keyword.updateOne(
                { _id: keywords[k]._id },
                { $set: newObj }
              );
            }
          }

          let subProjectObj = {};
          subProjectObj.prevDate = subProjectList[i].currDate;
          subProjectObj.currDate = currentDate;
          subProjectObj.nextDate = nextDate;
          subProjectObj.updatedAt = dateFunc.currentUtcTime();

          await SubProject.updateOne(
            { _id: subProjectList[i].id },
            { $set: subProjectObj }
          );
        }
      }
    } catch (error) {
      console.log("error in updateNewRank.cron =>", error);
    }
    updateNewRank.taskRunning = false;
  },
  start: true,
});

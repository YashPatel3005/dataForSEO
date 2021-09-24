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

      subProjectList.forEach(async (data) => {
        const keywords = await Keyword.find({
          _subProjectId: data._id,
        });
        console.log(keywords);

        let nextDate;
        if (
          subProjectList[i].keywordCheckFrequency ===
          appConstant.keywordCheckFrequency.daily
        ) {
          nextDate = dateFunc.addDate(currentDate, 1, "days");
          nextDate = dateFunc.getAfterMidnightTimeOfDate(nextDate);
          console.log(nextDate);
        } else if (
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

              newObj.currDate = currentDate;
              newObj.nextDate = nextDate;

              newObj.updatedAt = dateFunc.currentUtcTime();
              // console.log(newObj);

              await Keyword.updateOne({ _id: keyword._id }, { $set: newObj });

              console.log("keywords has been updated >>>");
            }
          })
        );
        let subProjectObj = {};
        subProjectObj.prevDate = data.currDate;
        subProjectObj.currDate = currentDate;
        subProjectObj.nextDate = nextDate;
        subProjectObj.updatedAt = dateFunc.currentUtcTime();

        await SubProject.updateOne({ _id: data.id }, { $set: subProjectObj });
      });
    } catch (error) {
      console.log("error in updateNewRank.cron =>", error);
    }
    updateNewRank.taskRunning = false;
  },
  start: true,
});

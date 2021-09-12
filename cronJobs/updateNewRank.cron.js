const CronJob = require("cron").CronJob;
const axios = require("axios");

const SubProject = require("../models/subProject.model");
const dateFunc = require("../helpers/dateFunctions.helper");
const appConstant = require("../app.constant");

const updateNewRank = new CronJob({
  cronTime: "* * * * *",
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

      if (subProjectList && subProjectList.length > 0) {
        for (let i = 0; i < subProjectList.length; i++) {
          console.log(subProjectList[i]);

          const keyword = subProjectList[i].keyword;
          const locationCode = subProjectList[i].locationCode;
          const languageCode = subProjectList[i].languageCode;
          const domain = subProjectList[i].domain;

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
                language_code: languageCode,
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
            console.log(result);

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

            if (result) {
              let newObj = {};

              newObj.rankGroup = result.rank_group;
              newObj.rankAbsolute = result.rank_absolute;

              newObj.prevDate = subProjectList[i].currDate;
              newObj.prevRankAbsolute = subProjectList[i].rankAbsolute;

              newObj.currDate = currentDate;
              newObj.nextDate = nextDate;

              newObj.updatedAt = dateFunc.currentUtcTime();
              console.log(newObj);

              await SubProject.updateOne(
                { _id: subProjectList[i].id },
                { $set: newObj }
              );
            }
          }

          if (createTask.data.status_code === 20000) {
            setTimeout(getTask, 15000);
          }
        }
      }
    } catch (error) {
      console.log("error in updateNewRank.cron =>", error);
    }
    updateNewRank.taskRunning = false;
  },
  start: true,
  timeZone: "UTC",
});

const fs = require("fs");
const path = require("path");
const moment = require("moment");
const CronJob = require("cron").CronJob;
const SubProject = require("../models/subProject.model");
const dateFunc = require("../helpers/dateFunctions.helper");
const axios = require("axios");

const updateNewAddedSerpData = new CronJob(
  "* * * * *",
  async () => {
    try {
      console.log("inside updateNewAddedSerpData cron =>");
      const newData = await SubProject.find({ newInserted: true });
      console.log(newData);

      if (newData && newData.length > 0) {
        for (let i = 0; i < newData.length; i++) {
          console.log(newData[i].keyword);
          let seoData = await axios({
            method: "post",
            url: process.env.SERP_API,
            auth: {
              username: process.env.SERP_API_USERNAME,
              password: process.env.SERP_API_PASSWORD,
            },
            data: [
              {
                keyword: encodeURI(newData[i].keyword),
                location_code: newData[i].locationCode,
                language_code: "en",
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
                item.domain == newData[i].domain
              ) {
                result = item;
              }
            }
          }

          if (result) {
            result.seDomain = seoData.data.tasks[0].result[0].se_domain;
            result.languageCode = seoData.data.tasks[0].result[0].language_code;
            result.updatedAt = dateFunc.currentUtcTime();
            result.newInserted = false;

            result.rankGroup = result.rank_group;
            result.rankAbsolute = result.rank_absolute;
            delete result.rank_group;
            delete result.rank_absolute;
            console.log(result);

            await SubProject.updateOne(
              { _id: newData[i]._id },
              { $set: result }
            );
            console.log("Sub project data has been updated >>>");
          } else {
            console.log("Domain and keyword is not match >>>");
            await SubProject.updateOne(
              { _id: newData[i]._id },
              {
                $set: {
                  newInserted: false,
                  error: true,
                  errorMessage: "Domain and keyword is not valid!!!",
                },
              }
            );
          }
        }
      } else {
        console.log("New data not found!!!");
      }
    } catch (error) {
      console.log("error in updateNewAddedSerpData.cron=> ", error);
    }
  },
  null,
  true
  // "UTC"
);

updateNewAddedSerpData.start();

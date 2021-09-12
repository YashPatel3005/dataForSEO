const CronJob = require("cron").CronJob;
const SubProject = require("../models/subProject.model");
const dateFunc = require("../helpers/dateFunctions.helper");

const updateNewRank = new CronJob({
  cronTime: "* * * * * *",
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

      process.exit(1);
    } catch (error) {
      console.log("error in updateNewRank.cron =>", error);
    }
    updateNewRank.taskRunning = false;
  },
  start: true,
  timeZone: "UTC",
});

const CronJob = require("cron").CronJob;
const Task = require("../models/task.model");
const dateFunction = require("../helpers/dateFunctions.helper.");

//Run cron on every monday
//0 0 * * MON
const removeLastWeekData = new CronJob({
  cronTime: "0 0 * * MON",
  onTick: async () => {
    if (removeLastWeekData.taskRunning) {
      return;
    }
    removeLastWeekData.taskRunning = true;

    try {
      console.log("inside cron =>");

      const fourWeekAgoDate = dateFunction.fourWeekAgoDate();
      const beforeMidnightTimeOfDate =
        dateFunction.getBeforeMidnightTimeOfDate(fourWeekAgoDate);
      const date = dateFunction.getDateFromTimestamp(beforeMidnightTimeOfDate);

      console.log("four week ago date => " + date);

      await Task.deleteMany({ createdAt: { $lte: date } });
    } catch (error) {
      console.log("error in removeLastWeekData.cron =>", error);
    }
    removeLastWeekData.taskRunning = false;
  },
  start: true,
  timeZone: "UTC",
});

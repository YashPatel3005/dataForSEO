const CronJob = require("cron").CronJob;
const Task = require("../models/task.model");
const dateFunction = require("../helpers/dateFunctions.helper.");

//Run cron on every monday
//0 0 * * MON
const removeLastWeekData = new CronJob({
  cronTime: "30 * * * *",
  onTick: async () => {
    if (removeLastWeekData.taskRunning) {
      return;
    }
    removeLastWeekData.taskRunning = true;

    try {
      console.log("inside cron =>");

      let currDate = dateFunction.currentUtcTime();
      const fourWeekAgoDate = dateFunction.subtractDate(currDate, 28, "days");
      const afterMidnightTimeOfDate =
        dateFunction.getAfterMidnightTimeOfDate(fourWeekAgoDate);
      const date = dateFunction.getDateFromTimestamp(afterMidnightTimeOfDate);

      console.log("four week ago date => " + date);

      //Remove 4 week ago data
      await Task.deleteMany({ date: { $eq: date } });

      //Add previous week rank in database
      let data = await Task.find({}).sort({ createdAt: -1 });

      let temp = [];

      //Get week ago date from cron when it will run
      let prevDate;
      prevDate = dateFunction.subtractDate(currDate, 7, "days");
      prevDate = dateFunction.getAfterMidnightTimeOfDate(prevDate);
      prevDate = dateFunction.getDateFromTimestamp(prevDate);

      //store week ago data in Temp array from that date
      for (let i = 0; i < data.length; i++) {
        const prevData = await Task.findOne({
          $and: [{ _id: data[i]._id }, { date: { $lte: prevDate } }],
        });

        if (prevData) {
          temp.push(prevData);
        }
      }
      console.log("temp ->>> " + temp);

      for (let j = 0; j < temp.length; j++) {
        //if previous date is 1 week ago then it will update
        currDate = dateFunction.addDate(temp[j].date, 7, "days");
        currDate = dateFunction.getAfterMidnightTimeOfDate(currDate);
        currDate = dateFunction.getDateFromTimestamp(currDate);

        await Task.updateOne(
          {
            $and: [
              { domain: temp[j].domain },
              { keyword: temp[j].keyword },
              { date: { $eq: currDate } },
            ],
          },
          { $set: { prevRankAbsolute: temp[j].rankAbsolute } }
        ).sort({ createdAt: -1 });

        // const aa = await Task.findOne(
        //   {
        //     $and: [
        //       { domain: temp[j].domain },
        //       { keyword: temp[j].keyword },
        //       { date: { $eq: currDate } },
        //     ],
        //   }
        // ).sort({ createdAt: -1 });
        // console.log(aa);
      }
    } catch (error) {
      console.log("error in removeLastWeekData.cron =>", error);
    }
    removeLastWeekData.taskRunning = false;
  },
  start: true,
  timeZone: "UTC",
});

const moment = require("moment");

// returns current UTC time
exports.currentUtcTime = () => {
  return moment().utc().format();
};

//get 4 week ago date
exports.fourWeekAgoDate = () => {
  return moment().utc().subtract(28, "days").format();
};

//get date in YYYY-MM-DDT23:59:59Z format
exports.getBeforeMidnightTimeOfDate = (date) => {
  return new Date(date).setUTCHours(23, 59, 59, 999);
};

//convert timestamp to date format
exports.getDateFromTimestamp = (date) => {
  return moment(date).utc().format();
};

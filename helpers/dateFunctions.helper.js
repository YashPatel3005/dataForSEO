const moment = require("moment");

// returns current UTC time
exports.currentUtcTime = () => {
  return moment().utc().format();
};

// pass arguments like this... (date, 7,"days")
exports.subtractDate = (date, value, unit) => {
  return moment(date).utc().subtract(value, unit).format();
};

// pass arguments like this... (date, 7,"days")
exports.addDate = (date, value, unit) => {
  return moment(date).utc().add(value, unit).format();
};

//get date in YYYY-MM-DDT23:59:59Z format
exports.getBeforeMidnightTimeOfDate = (date) => {
  return new Date(date).setUTCHours(23, 59, 59, 999);
};

//get date in YYYY-MM-DDT00:00:00Z format
exports.getAfterMidnightTimeOfDate = (date) => {
  return new Date(date).setUTCHours(0, 0, 0, 0);
};

//convert timestamp to date format
exports.getDateFromTimestamp = (date) => {
  return moment(date).utc().format();
};

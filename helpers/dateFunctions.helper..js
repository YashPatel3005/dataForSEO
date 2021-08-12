const moment = require("moment");

// returns current UTC time
exports.currentUtcTime = () => {
  return moment().utc().format();
};

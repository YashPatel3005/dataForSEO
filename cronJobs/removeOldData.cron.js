const fs = require("fs");
const path = require("path");
const moment = require("moment");
const CronJob = require("cron").CronJob;

//"0 */5 * * *
const removeFiles = new CronJob(
  "0 */5 * * *",
  async () => {
    try {
      const reportsDir = "reports";

      const directories = [reportsDir];

      for (const directory of directories) {
        fs.readdir(directory, (err, files) => {
          if (err) throw err;

          for (const file of files) {
            console.log(file, `removed at ${moment().utc().format()}`);
            fs.unlink(path.join(directory, file), (err) => {
              if (err) throw err;
            });
          }
        });
      }
    } catch (error) {
      console.log("error in removeFiles.cron=> ", error);
    }
  },
  null,
  true
);

removeFiles.start();

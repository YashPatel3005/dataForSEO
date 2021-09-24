require("./config/config");
global.express = require("express");
const app = express();

const https = require("https");
const http = require("http");
const fs = require("fs");

const middleWares = require("./middleware/index.middleware");

let env = process.env.NODE_ENV || "development";
const port = process.env.PORT;
const { mongoose } = require("./db/mongoose");

app.set("trust proxy", true);
app.set("appRootPath", __dirname);

middleWares(app);

// VERSION 1:
app.use("/api/v1", require("./v1/routes/index.routes"));

require("./cronJobs/updateNewRank.cron");
require("./cronJobs/removeOldData.cron");

if (process.env.STAGE == "LIVE") {
  // let options = {
  //   key: fs.readFileSync('./keys/privkey.pem'),
  //   cert: fs.readFileSync('./keys/cert.pem'),
  // };

  https.createServer(options, app).listen(port, () => {
    console.log(
      `Server started on ${process.env.STAGE} environment on port ${port}`
    );
  });
} else {
  http.createServer(app).listen(port, () => {
    console.log(
      `Server started on ${process.env.STAGE} environment on port ${port}`
    );
  });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace

if (env == "development") {
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
      message: err.message,
      error: true,
      e: err,
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
      message: err.message,
      error: true,
      e: err,
    });
  });
}

let reportsDirectory = "reports";
if (fs.existsSync(reportsDirectory) == false) {
  fs.mkdirSync(reportsDirectory);
}

module.exports = { app };

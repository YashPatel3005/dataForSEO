require("./config/config");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const https = require("https");
const http = require("http");
const cors = require("cors");
let env = process.env.NODE_ENV || "development";
const app = express();
const port = process.env.PORT;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// VERSION 1:
app.use("/api/v1", require("./v1/routes/index.routes"));

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

module.exports = { app };

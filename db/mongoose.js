const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", function () {
  console.log("connection established successfully");
});

mongoose.connection.on("error", function (err) {
  console.log("connection to mongo failed ", err);
});

mongoose.connection.once("open", function () {
  console.log("MongoDB connection opened!");
});

mongoose.connection.on("reconnected", function () {
  console.log("MongoDB reconnected!");
});

mongoose.connection.on("disconnected", function () {
  console.log("MongoDB disconnected!");
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
});

mongoose.exports = { mongoose };

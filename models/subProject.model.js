const mongoose = require("mongoose");

let subProjectSchema = new mongoose.Schema({
  keyword: {
    type: String,
    default: null,
  },
  // type: {
  //   type: String,
  //   default: null,
  // },
  // seDomain: {
  //   type: String,
  //   default: null,
  // },
  locationCode: {
    type: Number,
    default: null,
  },
  // languageCode: {
  //   type: String,
  //   default: null,
  // },
  prevDate: {
    type: Date,
    default: null,
  },
  currDate: {
    type: Date,
    default: null,
  },
  //nextDate is when user select monthly in keyword frequency then we will store after month date from current date and same as fortnightly and weekly
  nextDate: {
    type: Date,
    default: null,
  },
  // prevRankAbsolute: {
  //   type: Number,
  //   default: null,
  // },
  // rankAbsolute: {
  //   type: Number,
  //   default: null,
  // },
  // rankGroup: {
  //   type: Number,
  //   default: null,
  // },
  domain: {
    type: String,
    default: null,
  },
  keywordCheckFrequency: {
    type: Number,
    default: 0, // 0 - daily 1 - weekly 2 - Fortnightly 3 - monthly
  },
  // title: {
  //   type: String,
  //   default: null,
  // },
  // description: {
  //   type: String,
  //   default: null,
  // },
  // url: {
  //   type: String,
  //   default: null,
  // },
  // breadcrumb: {
  //   type: String,
  //   default: null,
  // },
  _projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
  newInserted: {
    type: Boolean,
    default: null,
  },
  newAddedKeyword: {
    type: String,
    default: null,
  },
  // error: {
  //   type: Boolean,
  //   default: null,
  // },
  // errorMessage: {
  //   type: String,
  //   default: null,
  // },
  createdAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const SubProject = mongoose.model("SubProject", subProjectSchema);
module.exports = SubProject;

const mongoose = require("mongoose");

let subProjectSchema = new mongoose.Schema({
  keyword: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: null,
  },
  seDomain: {
    type: String,
    default: null,
  },
  locationCode: {
    type: Number,
    default: null,
  },
  languageCode: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    default: null,
  },
  prevRankAbsolute: {
    type: Number,
    default: null,
  },
  rankGroup: {
    type: Number,
    default: null,
  },
  rankAbsolute: {
    type: Number,
    default: null,
  },
  domain: {
    type: String,
    default: null,
  },
  keywordCheckFrequency: {
    type: Number,
    default: 0, // 0 - weekly 1 - weekly 2 - monthly
  },
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  breadcrumb: {
    type: String,
    default: null,
  },
  _projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
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

const mongoose = require("mongoose");

let taskSchema = new mongoose.Schema({
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
  item: {
    type: {
      type: String,
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
  },
  createdAt: {
    type: Date,
    default: null,
  },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;

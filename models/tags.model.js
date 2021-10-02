const mongoose = require("mongoose");

let tagSchema = new mongoose.Schema({
  tagName: {
    type: String,
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

const Tag = mongoose.model("Tag", tagSchema);
module.exports = Tag;

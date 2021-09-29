const mongoose = require("mongoose");

let projectSchema = new mongoose.Schema({
  domain: {
    type: String,
    default: null,
  },
  projectName: {
    type: String,
    default: null,
  },
  assignedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  ],
  createdAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;

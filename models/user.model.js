const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dateFunc = require("../helpers/dateFunctions.helper");

let userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
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

//Generating auth token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = await jwt.sign(
    {
      _id: user._id.toString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  user.tokens = user.tokens.concat({
    token,
    // last_updated: moment().utc().add(12, "hour").format(),
  });

  user.updatedAt = await dateFunc.currentUtcTime();

  await user.save();
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;

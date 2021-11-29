const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const dateFunc = require("../helpers/dateFunctions.helper");
const appConstant = require("../app.constant");

let adminSchema = new mongoose.Schema({
  permissionLevel: {
    type: Number,
    default: appConstant.adminPermissionLevel.admin,
  },
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
  },
  firstName: {
    type: String,
    require: true,
  },
  lastName: {
    type: String,
    require: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
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
  projectAccess: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
});

adminSchema.pre("save", function (next) {
  let admin = this;
  if (admin.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(admin.password, salt, (err, hash) => {
        admin.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

//Generating auth token
adminSchema.methods.generateAuthToken = async function () {
  const admin = this;
  const token = await jwt.sign(
    {
      _id: admin._id.toString(),
    },
    process.env.JWT_SECRET,
    // { expiresIn: "24h" }
  );
  admin.tokens = admin.tokens.concat({
    token,
    // last_updated: moment().utc().add(12, "hour").format(),
  });

  admin.updatedAt = await dateFunc.currentUtcTime();

  await admin.save();
  return token;
};

//Checking if password is valid
adminSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

//Checking for user credentials
adminSchema.statics.findByCredentials = async function (email, password) {
  const admin = await Admin.findOne({ email: email });

  if (!admin) {
    return 1;
  }

  if (!admin.validPassword(password)) {
    return 2;
  }

  return admin;
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;

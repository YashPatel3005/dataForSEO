const dateFunc = require("../../helpers/dateFunctions.helper");
const Admin = require("../../models/admin.model");
const commonMessage = require("../../helpers/commonMessage.helper");
const { google } = require("googleapis");

exports.createAdmin = async (req, res) => {
  try {
    const reqBody = req.body;

    reqBody.createdAt = dateFunc.currentUtcTime();
    reqBody.updatedAt = dateFunc.currentUtcTime();

    const emailIdExists = await Admin.findOne({ email: req.body.email });

    if (emailIdExists) {
      return res.status(400).send({
        message:
          "Admin user with this email id already exists. Please enter different email id.",
        status: false,
        data: {},
      });
    }

    const admin = await Admin.create(reqBody);

    return res.status(200).send({
      data: admin,
      message: "Super admin credential created.",
      status: true,
    });
  } catch (error) {
    console.log("error in createAdmin()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

exports.createGoogleAuth = async (req, res) => {
  try {
    // STEP 1: CREATE GOOGLE OAuth ID FROM DEVELOPER CONSOLE TO GET SECRET KEYS
    // SET REDIRECTION URL IN CONSENT SCREEN CONFIGURATION
    // ENABLE Drive, Google + API from API LIBRARY
    const oauth2Client = new google.auth.OAuth2(
      "1088957008285-n6o7qverf7j31482qo4t6dp8tbgntmnb.apps.googleusercontent.com",
      "USaZ7-OMKHkAgoVla0yIRTtg",
      "https://developers.google.com/oauthplayground"
    );

    const scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/plus.login",
      "https://www.googleapis.com/auth/drive.file",
      // 'https://www.googleapis.com/auth/spreadsheets',
    ];

    // STEP 2: RUN BELOW CODE TO GET URL
    // OPEN URL IN BROWSER
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    console.log(url);

    // STEP 3: GET ACCESS CODE FROM REDIRECTION URL AND USE IN BELOW CODE
    const generateToken = async () => {
      try {
        const { tokens } = await oauth2Client.getToken(
          "4/0AX4XfWh3RGTxZdsH2U0ANXMrNg1xU0NbppEOELgTcEKISz8bCRc3-YS9q9xBfNi_Uj3r3A"
        );
        oauth2Client.setCredentials(tokens);
      } catch (error) {
        console.log(error);
      }
    };
    generateToken();

    oauth2Client.on("tokens", async (tokens) => {
      console.log(tokens);
      if (tokens.refresh_token) {
        console.log(tokens.refresh_token);
      }
      console.log(tokens.access_token);

      return res.status(400).send({
        data: {
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
        },
        message: "Google credential created.",
        status: true,
      });

      /* ALSO YOU CAN STORE CREDENTIAL IN NEW COLLECTION LIKE BELOW*/

      // const admin = await GoogleAuth.findOne({});
      // console.log(admin);

      // admin.accessToken = tokens.access_token;
      // admin.refreshToken = tokens.refresh_token;

      // await admin.save();

      // console.log(admin);
    });
  } catch (error) {
    console.log("error in createGoogleAuth()=> ", error);

    return res.status(400).send({
      data: {},
      message: commonMessage.ERROR_MESSAGE.GENERAL_CATCH_MESSAGE,
      status: false,
    });
  }
};

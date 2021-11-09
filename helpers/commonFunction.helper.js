const { validationResult } = require("express-validator");
const requestHelper = require("./requestHelper.helper");

// show validation error message
exports.validatorFunc = (req, res, next) => {
  let errArray = {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send({
      statusCode: 422,
      message: errors.array()[0].msg,
      error: true,
      data: {},
    });
  }
  next();
};

exports.refreshToken = async (req, res) => {
  try {
    let refreshToken = process.env.GOOGLE_SHEET_REFRESH_TOKEN;

    let methodPOST = "POST";

    body = {
      refreshToken: refreshToken,
      client_id: process.env.GOOGLE_SHEET_CLIENT_ID,
      client_secret: process.env.GOOGLE_SHEET_CLIENT_SECRET,
      grant_type: "refresh_token",
    };

    let url1 = `https://www.googleapis.com/oauth2/v4/token`;
    let response1 = await requestHelper.callPostApi(
      methodPOST,
      url1,
      refreshToken,
      body
    );

    return response1.access_token;
  } catch (error) {
    console.log("error in refreshAccessToken=> ", error);
    throw error;
  }
};

exports.generateGoogleSheet = async (sheetTitle, sheetHeading, defineSheet) => {
  try {
    let sheetURL;

    let sheetData = { sheetURL: "", sheetId: "" };

    let methodPOST = "POST";
    let methodPUT = "PUT";
    let refreshToken = process.env.GOOGLE_SHEET_REFRESH_TOKEN;
    // let clientId =
    //   "1088957008285-n6o7qverf7j31482qo4t6dp8tbgntmnb.apps.googleusercontent.com";
    // let clientSecret = "USaZ7-OMKHkAgoVla0yIRTtg";
    body = {
      refreshToken: refreshToken,
      client_id: process.env.GOOGLE_SHEET_CLIENT_ID,
      client_secret: process.env.GOOGLE_SHEET_CLIENT_SECRET,
      grant_type: "refresh_token",
    };

    let url1 = `https://www.googleapis.com/oauth2/v4/token`;
    let response1 = await requestHelper.callPostApi(
      methodPOST,
      url1,
      refreshToken,
      body
    );
    // console.log(response1);

    let url2 = `https://sheets.googleapis.com/v4/spreadsheets`;
    body2 = {
      properties: {
        title: sheetTitle,
      },
    };
    let response2 = await requestHelper.callPostApi(
      methodPOST,
      url2,
      response1.access_token,
      body2
    );
    // console.log(response2);

    let sheetID = response2.spreadsheetId;
    sheetURL = response2.spreadsheetUrl;
    sheetData.sheetURL = sheetURL;
    sheetData.sheetId = sheetID;

    let url3 = `https://www.googleapis.com/drive/v3/files/${sheetID}/permissions`;
    body3 = {
      type: "anyone",
      role: "writer",
    };
    let response3 = await requestHelper.callPostApi(
      methodPOST,
      url3,
      response1.access_token,
      body3
    );

    let defineSheet = "Sheet1!A1:F1";
    let url4 = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${defineSheet}?valueInputOption=USER_ENTERED`;
    body4 = {
      values: sheetHeading,
    };
    let response4 = await requestHelper.callPutApi(
      methodPUT,
      url4,
      response1.access_token,
      body4
    );

    console.log(sheetData, "*-*-*-*-*-*--*-*-*-*");

    return sheetData;
  } catch (error) {
    console.log(error);
  }
};

exports.appendDataInSheet = async (accessToken, sheetId, sheetBody) => {
  try {
    let methodPOST = "POST";
    let methodPUT = "PUT";

    let appendDataURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:C1:append?valueInputOption=USER_ENTERED`;
    let updateDataURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;

    let finalUrl;
    let body;

    finalMethod = methodPOST;
    finalUrl = appendDataURL;
    body = {
      values: sheetBody,
    };

    let response5 = await requestHelper.callPostApi(
      finalMethod,
      finalUrl,
      accessToken,
      body
    );

    // console.log("response5=> ", response5);
    return response5;
  } catch (error) {
    console.log("error in refreshAccessToken=> ", error);
    throw error;
  }
};

exports.generateRandomPassword = function () {
  try {
    let chars = [
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      "0123456789",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      "!@#%$&",
    ];
    let randPwd = [3, 3, 3, 1]
      .map(function (len, i) {
        return Array(len)
          .fill(chars[i])
          .map(function (x) {
            return x[Math.floor(Math.random() * x.length)];
          })
          .join("");
      })
      .concat()
      .join("")
      .split("")
      .sort(function () {
        return 0.5 - Math.random();
      })
      .join("");
    return randPwd;
  } catch (error) {
    console.log("Generating Random password error::>>>>" + error);
  }
};

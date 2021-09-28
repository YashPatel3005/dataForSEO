const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

//Set up email service
const sendMail = async (to, subject, body) => {
  try {
    const msg = {
      to: to,
      from: process.env.EMAIL_FROM,
      subject: subject,
      html: body,
    };

    const sendMail = await sgMail.send(msg);
    console.log("sendMail=> ", sendMail);
    return true;
  } catch (err) {
    console.log("er....", err);
    console.log(err.message);
    throw err;
  }
};

module.exports = sendMail;

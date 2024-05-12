// sendEmail.js
const nodemailer = require("nodemailer");

function sendEmail(email, verificationCode) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "futureinfinitygadgets@gmail.com",
      pass: "ndhg vwvc aoor jbvi",
    },
  });

  const mailOptions = {
    from: "futureinfinitygadgets@gmail.com",
    to: email,
    subject: "Hello from Node.js",
    text: `Your verification code is: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("Error:", error.message);
    }
    console.log("Email sent:", info.response);
  });
}

module.exports = sendEmail;

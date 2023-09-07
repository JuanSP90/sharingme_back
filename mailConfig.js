const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
    // host: "smtp-mail.outlook.com",
    // port: 587,
    // secure: false,
    // service: 'Hotmail',
    // auth: {
    //     user: 'sharingmeapp@hotmail.com',
    //     pass: process.env.EMAILPASSWORD
    // }
});

module.exports = transporter;
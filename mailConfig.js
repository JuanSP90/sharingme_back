const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'sharingmeapp@gmail.com',
        pass: process.env.EMAILPASSWORD
    }
});

module.exports = transporter;
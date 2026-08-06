import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use another service like 'SendGrid', 'Mailgun', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
});

export const sendMail = async (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body (optional)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
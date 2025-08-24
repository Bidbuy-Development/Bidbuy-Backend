import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

export const sendEmail = async (to, subject, html, text, ) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            text
        };

        await transporter.sendMail(mailOptions);
        // logger.info('Email sent successfully', { to, subject });
    } catch (error) {
        // logger.error('Error sending email', { 
        //     to, 
        //     subject, 
        //     error: error.message 
        // });
        throw error; // Re-throw to be handled by the calling function
    }
}

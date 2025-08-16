import nodemailer from "nodemailer";
import logger from "../middleware/logger.js";

export const sendEmail = async (to, subject, html, text, ) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // Replace with your SMTP server
            port: process.env.EMAIL_PORT, // Replace with your SMTP port
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
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

import nodemailer from "nodemailer";

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
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

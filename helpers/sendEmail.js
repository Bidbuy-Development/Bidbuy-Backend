import emailTemplates from './emailTemplate.js';
import { sendEmail } from '../config/email.js';

// Helper function to send verification email
export const sendVerificationEmail = async (email, emailToken, name = 'there') => {
    try {
        const verificationTemplate = emailTemplates.welcomeTemplate(name, emailToken);
        
        await sendEmail(
            email,
            verificationTemplate.subject,
            verificationTemplate.html,
            `Your verification code is: ${emailToken}. Please enter this code in the verification page.`
        );
        // logger.info(`Verification email sent to ${email}`);
    } catch (error) {
        console.log(error);
        // logger.error(error, 'Error sending verification email');
        throw new Error('Failed to send verification email');
    }
};
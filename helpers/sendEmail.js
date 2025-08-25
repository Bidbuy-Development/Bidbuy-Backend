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

// Helper function to send password reset email
export const sendPasswordResetEmail = async (email, otp, name = 'there') => {
    try {
        const resetTemplate = emailTemplates.passwordResetTemplate(name, otp);
        
        await sendEmail(
            email,
            resetTemplate.subject,
            resetTemplate.html,
            `Your password reset code is: ${otp}. Please enter this code in the password reset page.`
        );
        // logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
        console.log(error);
        // logger.error(error, 'Error sending password reset email');
        throw new Error('Failed to send password reset email');
    }
};

//password reset success email
export const sendPasswordResetSuccessEmail = async (email, name = 'there') => {
    try {
        const successTemplate = emailTemplates.passwordResetSuccessTemplate(name);
        
        await sendEmail(
            email,
            successTemplate.subject,
            successTemplate.html,
            `Your password has been successfully reset. If you did not perform this action, please contact support immediately.`
        );
         logger.info(`Password reset success email sent to ${email}`);
    } catch (error) {
        console.log(error);
         logger.error(error, 'Error sending password reset success email');
        throw new Error('Failed to send password reset success email');
    }
}
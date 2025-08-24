import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL;

const emailTemplates = {
  // Welcome & Email Verification Template
  welcomeTemplate: (name, emailToken) => ({
    subject: 'Welcome to BidBuy - Your Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to BidBuy</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Welcome to BidBuy, ${name}!</h2>
              <p>We're excited to have you join our community.</p>
              
              <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; text-align: center; border-radius: 4px; border: 1px dashed #ddd;">
                  <p style="margin: 0 0 15px 0; color: #555;">Your verification code is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2c3e50; margin: 15px 0;">
                      ${emailToken}
                  </div>
                  <p style="margin: 15px 0 0 0; color: #777; font-size: 14px;">
                      This code will expire in 5 minutes.
                  </p>
              </div>
              
              <p>To complete your registration, please enter this code in the verification page.</p>
              
              <p style="margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 20px;">
                  If you didn't request this verification, please ignore this email.<br>
                  <br>
                  Thank you,<br>
                  The BidBuy Team
              </p>
          </div>
      </body>
      </html>
    `
  }),

  //login template
  loginTemplate: (name, loginTime, ipAddress) => ({
  subject: 'BidBuy - New Login Detected',
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; 
                    border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p>We noticed a login to your BidBuy account.</p>
            <p><strong>Login Time:</strong> ${loginTime}</p>
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p>If this was you, you can safely ignore this email.</p>
            <p>If you didn’t log in, please <a href="${BASE_URL}/reset-password" style="color: #007BFF; text-decoration: none;">reset your password</a> immediately and contact our support team.</p>
            <p style="margin-top: 20px; font-size: 0.9em; color: #555;">
                Stay safe,<br>
                The BidBuy Team
            </p>
        </div>
    </body>
    </html>
  `
}),


  // Password Reset Template
  passwordResetTemplate: (name, otp) => ({
    subject: 'BidBuy - Password Reset Request',
    html: `
      <html>
        <body>
          <p>Hi ${name},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${BASE_URL}/reset-password/${otp}" 
             style="display:inline-block;padding:10px 20px;background:#28a745;color:#fff;border-radius:5px;text-decoration:none;">
            Reset Password
          </a>
          <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
          <p>${BASE_URL}/reset-password/${otp}</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
        </body>
      </html>
    `
  }),

  // Bid Confirmation Template
  bidConfirmationTemplate: (name, bidId) => ({
    subject: 'BidBuy - Your Bid Has Been Placed',
    html: `
      <html>
        <body>
          <p>Hi ${name},</p>
          <p>Your bid with ID <strong>${bidId}</strong> has been successfully placed.</p>
          <p>You can view your bid details here:</p>
          <a href="${BASE_URL}/bids/${bidId}" 
             style="display:inline-block;padding:10px 20px;background:#17a2b8;color:#fff;border-radius:5px;text-decoration:none;">
            View Bid
          </a>
        </body>
      </html>
    `
  }),

  // Escrow Release Notification
  escrowReleaseTemplate: (name, escrowId) => ({
    subject: 'BidBuy - Escrow Funds Released',
    html: `
      <html>
        <body>
          <p>Hi ${name},</p>
          <p>The funds for your escrow ID <strong>${escrowId}</strong> have been released.</p>
          <p>You can view the transaction here:</p>
          <a href="${BASE_URL}/escrow/${escrowId}" 
             style="display:inline-block;padding:10px 20px;background:#ffc107;color:#000;border-radius:5px;text-decoration:none;">
            View Escrow
          </a>
        </body>
      </html>
    `
  })
};

export default emailTemplates;

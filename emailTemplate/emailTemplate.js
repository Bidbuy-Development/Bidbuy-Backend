import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL;

const emailTemplates = {
  // Welcome & Email Verification Template
  welcomeTemplate: (name, emailToken) => ({
    subject: 'Welcome to BidBuy - Please Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to BidBuy</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Welcome to BidBuy, ${name}!</h2>
              <p>We're excited to have you join our community.</p>
              <p>To complete your registration, please verify your email by clicking the button below:</p>
              <a href="${BASE_URL}/verify-email/${emailToken}" 
                 style="display: inline-block; background-color: #007BFF; color: #fff; padding: 10px 20px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                 Verify Email
              </a>
              <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
              <p>${BASE_URL}/verify-email/${emailToken}</p>
              <p style="margin-top: 20px; font-size: 0.9em; color: #555;">
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

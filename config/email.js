// services/emailService.js
const nodemailer = require("nodemailer");

// Create transporter once (better performance)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

// Send welcome email to user
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: `"RAJGym" <${process.env.EMAIL_USER}>`,
      to: userEmail,  // ✅ Send to user's email
      subject: "Welcome to RAJGym! 🏋️‍♂️",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #95C11E; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; color: #000; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 10px 20px; background: #95C11E; color: #000; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏋️ RAJGym</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${userName}! 💪</h2>
              <p>Thank you for joining RAJGym. Your fitness journey starts now!</p>
              <h3>What you can do:</h3>
              <ul>
                <li>📊 Track your workouts</li>
                <li>🎯 Set fitness goals</li>
                <li>🏆 Monitor your progress</li>
                <li>💪 Get personalized tips</li>
              </ul>
              <a href="https://rajgym-11si.onrender.com/login" class="button">Start Training →</a>
              <p style="margin-top: 20px;"><strong>Remember:</strong> Every rep counts. Every day matters.</p>
              <p>💚 The RAJGym Team</p>
            </div>
            <div class="footer">
              <p>© 2024 RAJGym. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to RAJGym! 🏋️‍♂️

Hello ${userName}!

Thank you for joining RAJGym. Your fitness journey starts now!

What you can do:
- Track your workouts
- Set fitness goals
- Monitor your progress
- Get personalized tips

Start training: https://rajgym-11si.onrender.com/login

Remember: Every rep counts. Every day matters.

💚 The RAJGym Team
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to:", userEmail);
    return { success: true };

  } catch (error) {
    console.error("❌ Email error:", error.message);
    return { success: false, error: error.message };
  }
};

// Send password reset email (optional)
const sendResetEmail = async (userEmail, resetToken) => {
  try {
    const resetLink = `https://rajgym-11si.onrender.com/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"RAJGym" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Reset Your RAJGym Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #95C11E;">Reset Your Password</h2>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #95C11E; color: #000; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Reset email sent to:", userEmail);
    return { success: true };

  } catch (error) {
    console.error("❌ Reset email error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendResetEmail };
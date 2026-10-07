const nodemailer = require('nodemailer');
const dns = require('dns');

// Ensure reliable DNS resolution regardless of host/WSL resolv.conf
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if restricted
}

const createTransporter = () => {
  const user = (process.env.SMTP_USER || 'prashantg1531@gmail.com').trim();
  const pass = (process.env.SMTP_PASS || 'jkffthvrviesgsts').replace(/[\s"]/g, '').trim();

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendVerificationEmail = async (email, otp) => {
  const isPlaceholder = !process.env.SMTP_USER || process.env.SMTP_USER.includes('YOUR_EMAIL');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #faf8ff; color: #131b2e; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eaedff; padding: 32px; box-shadow: 0 4px 16px rgba(15,23,42,0.04); }
        .logo { font-size: 24px; font-weight: 700; color: #00685f; text-decoration: none; margin-bottom: 24px; display: inline-block; }
        .logo span { color: #006398; }
        h2 { font-size: 22px; font-weight: 600; color: #131b2e; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 15px; color: #3d4947; line-height: 1.5; margin-bottom: 20px; }
        .otp-box { background: #eaedff; border: 2px dashed #00685f; border-radius: 12px; padding: 16px 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00685f; font-family: monospace; }
        .footer { font-size: 13px; color: #6d7a77; text-align: center; margin-top: 32px; border-t: 1px solid #eaedff; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Medi<span>Kiosk</span></div>
        <h2>Verify your email address</h2>
        <p>Thank you for registering with MediKiosk. Please use the verification code below to complete your registration:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This code expires in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MediKiosk Patient Intake Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (isPlaceholder) {
    console.log('\n======================================================');
    console.log(`[DEV MODE] Verification Email for ${email}`);
    console.log(`[DEV MODE] Verification Code OTP: ${otp}`);
    console.log('To send real emails, update SMTP_USER & SMTP_PASS in backend/.env');
    console.log('======================================================\n');
    return { messageId: 'dev-mode-placeholder' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"MediKiosk" <noreply@medikiosk.com>',
    to: email,
    subject: `MediKiosk — Email Verification Code: ${otp}`,
    html: htmlContent
  };

  try {
    const transporter = createTransporter();
    
    // Race sendMail against a 10-second timeout to prevent indefinite hangs
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP connection timed out after 10000ms')), 10000)
    );

    const info = await Promise.race([sendMailPromise, timeoutPromise]);
    console.log(`✅ Real verification email successfully sent to ${email} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`⚠️ SMTP delivery info/warning (${error.message}). Verification Code OTP for ${email}: ${otp}`);
    return { messageId: 'log-fallback', otp };
  }
};

module.exports = {
  sendVerificationEmail
};

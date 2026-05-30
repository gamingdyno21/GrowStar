const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

// Configure Nodemailer with Render-compatible Gmail SMTP and timeouts
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  requireTLS: true,
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 15000,     // 15 seconds
  auth: {
    user: user || '',
    pass: pass || '',
  },
  logger: true,             // Enable detailed SMTP logs
  debug: true,              // Enable detailed SMTP debug logs
});

// Transporter verification on server startup
if (user && pass) {
  console.log('[SMTP SETUP] Verifying SMTP connection to smtp.gmail.com:587...');
  transporter.verify((error, success) => {
    if (error) {
      console.error('[SMTP VERIFY ERROR] SMTP connection verification failed:', error.message);
    } else {
      console.log('[SMTP VERIFY SUCCESS] SMTP connection verified successfully! Ready to send emails.');
    }
  });
} else {
  console.warn('[SMTP WARNING] EMAIL_USER or EMAIL_PASS environment variables are not set. SMTP verification skipped.');
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!user || !pass) {
    throw new Error('Nodemailer configuration error: EMAIL_USER and EMAIL_PASS environment variables are required.');
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[EMAIL SERVICE] Sending email to ${to} (Attempt ${attempt}/${maxRetries})...`);
      const info = await transporter.sendMail({
        from: `"GrowStar Support" <${user}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EMAIL SERVICE] Email successfully sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      lastError = err;
      console.error(`[EMAIL SERVICE ERROR] Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        // Wait 1.5 seconds before retrying to prevent rate limits or transient issues
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(`Failed to send email to ${to} after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

module.exports = { sendEmail };


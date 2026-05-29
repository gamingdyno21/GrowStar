const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Nodemailer configuration error: EMAIL_USER and EMAIL_PASS environment variables are required.');
  }

  // Configure Nodemailer with Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from: `"GrowStar Support" <${user}>`,
    to,
    subject,
    text,
    html,
  });

  console.log(`[EMAIL SERVICE] Real OTP Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };

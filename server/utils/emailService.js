const { Resend } = require('resend');

const sendEmail = async ({ to, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM || 'GrowStar <onboarding@resend.dev>';

  // Diagnostics logs before sending (points 3, 6, 8)
  console.log("RESEND KEY EXISTS:", !!apiKey);
  console.log("RESEND FROM:", sender);

  if (!apiKey) {
    const errMsg = 'Resend configuration error: RESEND_API_KEY environment variable is required.';
    console.error(`[RESEND ERROR] ${errMsg}`);
    throw new Error(errMsg);
  }

  const resend = new Resend(apiKey);

  // GrowStar premium email design markup
  const htmlContent = `
    <div style="background-color: #040914; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; color: #f8fafc; min-height: 100%;">
      <div style="max-width: 480px; margin: 0 auto; background: rgba(15, 25, 45, 0.95); border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 12px; padding: 40px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        
        <!-- Logo block -->
        <div style="margin-bottom: 25px; text-align: center;">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
            <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="#D4AF37" opacity="0.9" />
            <path d="M7 16L12 11L17 16" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M12 20V11.5" stroke="#1E3A8A" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="12" cy="11" r="1.5" fill="#2563EB" />
          </svg>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 22px; margin: 10px 0 0 0; letter-spacing: 1px;">GROWSTAR</h2>
          <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Grow Smarter. Invest Stronger.</p>
        </div>

        <!-- Divider -->
        <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent); margin-bottom: 30px;"></div>

        <!-- Content -->
        <p style="font-size: 15px; color: rgba(255, 255, 255, 0.95); margin: 0 0 25px 0; font-weight: 500; letter-spacing: 0.3px;">
          Your GrowStar verification code
        </p>

        <!-- OTP Display Box -->
        <div style="background: rgba(255, 255, 255, 0.04); border: 1.5px solid rgba(212, 175, 55, 0.5); border-radius: 8px; padding: 18px 25px; margin-bottom: 25px; display: inline-block;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 6px; margin-left: 6px;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: rgba(255, 255, 255, 0.65); line-height: 1.6; margin: 0 0 30px 0;">
          This code is valid for <strong>10 minutes</strong>. For security reasons, please do not share this verification code with anyone.
        </p>

        <!-- Footer -->
        <div style="font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-top: 20px;">
          <p style="margin: 0; font-weight: 500;">Secure Client Portal • Protected Financial Access</p>
          <p style="margin: 4px 0 0 0;">For assistance, please contact support at <a href="mailto:support@grow-star.site" style="color: #D4AF37; text-decoration: none;">support@grow-star.site</a></p>
          <p style="margin: 4px 0 0 0;">GrowStar © 2026. All rights reserved.</p>
        </div>

      </div>
    </div>
  `;

  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[RESEND SERVICE] Sending OTP to ${to} (Attempt ${attempt}/${maxRetries})...`);
      
      const response = await resend.emails.send({
        from: sender, // Passed directly to prevent nested headers
        to: [to],
        subject: 'GrowStar - OTP Verification',
        text: `Your GrowStar verification code is: ${otp}. It is valid for 10 minutes.`,
        html: htmlContent,
      });

      // Log exact Resend API response (point 4)
      console.log(`[RESEND API RESPONSE] Exact response:`, JSON.stringify(response, null, 2));

      if (response.error) {
        throw new Error(response.error.message || 'Resend API returned an error.');
      }

      console.log(`[RESEND SUCCESS] Email sent to ${to} successfully. ID: ${response.data.id}`);
      return response.data;
    } catch (err) {
      lastError = err;
      console.error(`[RESEND ERROR] Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        // Wait 1.5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(`Failed to send email to ${to} via Resend after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

module.exports = { sendEmail };




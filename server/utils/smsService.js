/**
 * smsService.js
 * Production MSG91 SMS OTP delivery service for GrowStar.
 * Uses MSG91 REST API v1 (sendotp.php) — no template setup required.
 */

/**
 * Sends a 6-digit OTP via MSG91 SMS to the given phone number.
 * @param {string} phone - 10-digit Indian mobile number (without country code)
 * @param {string} otp   - 6-digit OTP string to deliver
 */
const sendSMSOTP = async (phone, otp) => {
  const authKey  = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'GRWSTR';

  if (!authKey) {
    throw new Error(
      'SMS service configuration error: MSG91_AUTH_KEY is missing from environment variables.'
    );
  }

  // MSG91 requires 12-digit number with country code (91 for India)
  const mobile = phone.startsWith('91') ? phone : `91${phone}`;

  const message =
    `Your GrowStar verification OTP is ${otp}. ` +
    `Valid for 5 minutes. Do not share this code with anyone.`;

  const params = new URLSearchParams({
    authkey:     authKey,
    mobile:      mobile,
    message:     message,
    sender:      senderId,
    otp:         String(otp),
    otp_length:  '6',
    otp_expiry:  '5',
  });

  const url = `https://api.msg91.com/api/sendotp.php?${params.toString()}`;

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(
      `SMS service error: MSG91 returned HTTP ${response.status} (${response.statusText})`
    );
  }

  const raw = await response.text();

  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    // MSG91 occasionally returns plain text on success
    if (raw.toLowerCase().includes('error')) {
      throw new Error(`SMS delivery failed: ${raw}`);
    }
    result = { type: 'success', raw };
  }

  if (result.type === 'error') {
    throw new Error(
      `SMS delivery failed: ${result.message || 'MSG91 rejected the request. Check authkey and sender ID.'}`
    );
  }

  console.log(
    `[SMS SERVICE] OTP dispatched via MSG91 to +91-${phone} | request_id: ${result.request_id || 'N/A'}`
  );

  return result;
};

module.exports = { sendSMSOTP };

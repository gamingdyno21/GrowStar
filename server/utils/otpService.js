// In-memory OTP storage for development. In production, use Redis or database verification.
const otpStore = new Map();
const verifiedSessions = new Map();

const generateOTP = (identifier) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(identifier, { otp, expiresAt });
  return otp;
};

const verifyOTP = (email, enteredOtp) => {
  const record = otpStore.get(email);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  if (record.otp === enteredOtp) {
    otpStore.delete(email); // consume OTP
    return true;
  }

  return false;
};

const markIdentifierVerified = (identifier) => {
  verifiedSessions.set(identifier, Date.now() + 15 * 60 * 1000); // 15 minutes TTL
};

const isIdentifierVerified = (identifier) => {
  const expiry = verifiedSessions.get(identifier);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    verifiedSessions.delete(identifier);
    return false;
  }
  return true;
};

const consumeVerification = (identifier) => {
  verifiedSessions.delete(identifier);
};

module.exports = {
  generateOTP,
  verifyOTP,
  markIdentifierVerified,
  isIdentifierVerified,
  consumeVerification
};

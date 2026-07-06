// ============================================
// QR Token Utility
// Used for: Generate unique QR tokens for attendance sessions
// ============================================
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique QR token for an attendance session
 * @returns {string} UUID token
 */
const generateQRToken = () => {
  return uuidv4();
};

module.exports = { generateQRToken };

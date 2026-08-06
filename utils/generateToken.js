const crypto = require('crypto');

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

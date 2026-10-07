const crypto = require('crypto');
const User = require('../models/User');

const generateRandomHex = (length = 6) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
};

const generateUniqueHealthId = async () => {
  let isUnique = false;
  let healthId = '';

  while (!isUnique) {
    const randomChars = generateRandomHex(6);
    healthId = `MK-${randomChars}`;

    const existingUser = await User.findOne({ healthId });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return healthId;
};

module.exports = {
  generateUniqueHealthId
};

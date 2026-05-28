const crypto = require('crypto');

const SCRYPT_KEY_LENGTH = 64;

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (err, key) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(key.toString('hex'));
    });
  });

  return `${salt}:${derivedKey}`;
};

const verifyPassword = async (password, passwordHash) => {
  const [salt, storedKey] = String(passwordHash || '').split(':');

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (err, key) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(key);
    });
  });

  const storedBuffer = Buffer.from(storedKey, 'hex');

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
};

module.exports = {
  hashPassword,
  verifyPassword,
};

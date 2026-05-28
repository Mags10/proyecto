const { response, request } = require('express');
const User = require('../models/user.model');
const { verifyPassword } = require('../helpers/password.helper');
const { signToken, getJwtExpirationSeconds } = require('../helpers/token.helper');
const { serializeAuthUser } = require('../middlewares/auth.middleware');

const login = async (req = request, res = response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: 'Bad Request. Missing required fields: email, password',
      timestamp: new Date(),
    });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, active: true });

    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas',
        timestamp: new Date(),
      });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Credenciales inválidas',
        timestamp: new Date(),
      });
    }

    const serializedUser = serializeAuthUser(user);
    const accessToken = signToken({
      sub: serializedUser._id,
      email: serializedUser.email,
      role: serializedUser.role,
    });

    return res.status(200).json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: getJwtExpirationSeconds(),
      user: serializedUser,
      timestamp: new Date(),
    });
  } catch (error) {
    console.log('Error logging in:');
    console.log(error);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const me = async (req = request, res = response) => {
  return res.status(200).json({
    user: req.auth.user,
    timestamp: new Date(),
  });
};

module.exports = {
  login,
  me,
};

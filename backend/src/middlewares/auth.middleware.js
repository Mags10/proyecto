const { response, request } = require('express');
const User = require('../models/user.model');
const { verifyToken } = require('../helpers/token.helper');

const ROLES = {
  ADMIN: 'ADMIN',
  KITCHEN: 'KITCHEN',
  FLOOR: 'FLOOR',
};

const serializeAuthUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

const requireAuth = async (req = request, res = response, next) => {
  try {
    const authHeader = req.header('Authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Missing bearer token',
        timestamp: new Date(),
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyToken(token);

    const user = await User.findOne({ _id: payload.sub, active: true });
    if (!user) {
      return res.status(401).json({
        message: 'User session is no longer valid',
        timestamp: new Date(),
      });
    }

    req.auth = {
      user: serializeAuthUser(user),
      tokenPayload: payload,
    };

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
      timestamp: new Date(),
    });
  }
};

const requireRoles =
  (...roles) =>
  (req = request, res = response, next) => {
    const currentRole = req.auth?.user?.role;

    if (!currentRole || !roles.includes(currentRole)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
        timestamp: new Date(),
      });
    }

    next();
  };

module.exports = {
  ROLES,
  requireAuth,
  requireRoles,
  serializeAuthUser,
};

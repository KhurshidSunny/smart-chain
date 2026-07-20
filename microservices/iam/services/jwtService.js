const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user, roleName) => {
  const role =
    roleName ||
    (user.roleId && typeof user.roleId === 'object' ? user.roleId.name : undefined);

  return jwt.sign(
    { sub: user._id, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };

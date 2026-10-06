const jwt = require('jsonwebtoken');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET must be configured before starting MediNova');
  }
  return secret;
};

exports.validateAuthConfig = getSecret;
exports.generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role }, getSecret(), { expiresIn: '7d', algorithm: 'HS256' }
);
exports.verifyToken = (token) => jwt.verify(token, getSecret(), { algorithms: ['HS256'] });

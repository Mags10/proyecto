const crypto = require('crypto');

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlEncodeJson = (value) => base64UrlEncode(JSON.stringify(value));

const base64UrlDecodeJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const getJwtSecret = () => process.env.JWT_SECRET || 'kitchenflow-dev-secret-change-me';
const getJwtExpirationSeconds = () => Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 12);

const signToken = (payload) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + getJwtExpirationSeconds();
  const tokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: expiresAt
  };

  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(tokenPayload);
  const body = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
};

const verifyToken = (token) => {
  const segments = String(token || '').split('.');

  if (segments.length !== 3) {
    throw new Error('Invalid token');
  }

  const [encodedHeader, encodedPayload, receivedSignature] = segments;
  const body = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(body)
    .digest('base64url');

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(receivedSignature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = base64UrlDecodeJson(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
};

module.exports = {
  signToken,
  verifyToken,
  getJwtExpirationSeconds
};

const { randomUUID } = require('crypto');

const requestIdMiddleware = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

module.exports = requestIdMiddleware;

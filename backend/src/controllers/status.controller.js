const { request, response } = require('express');

const getStatus = (_req = request, res = response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running and connected to MongoDB',
    timestamp: new Date(),
  });
};

module.exports = {
  getStatus,
};

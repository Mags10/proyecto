const { Router } = require('express');
const { getStatus } = require('../controllers/status.controller');

const routes = Router();

routes.get('/', getStatus);

module.exports = routes;

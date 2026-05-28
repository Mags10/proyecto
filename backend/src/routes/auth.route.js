const { Router } = require('express');
const { login, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const routes = Router();

routes.post('/login', login);
routes.get('/me', requireAuth, me);

module.exports = routes;

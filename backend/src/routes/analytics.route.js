const { Router } = require('express');
const { getDashboard } = require('../controllers/analytics.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/dashboard', requireAuth, requireRoles(ROLES.ADMIN), getDashboard);

module.exports = routes;

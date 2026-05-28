const { Router } = require('express');
const { getSales, postSale } = require('../controllers/sales.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.FLOOR), getSales);
routes.post('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.FLOOR), postSale);

module.exports = routes;

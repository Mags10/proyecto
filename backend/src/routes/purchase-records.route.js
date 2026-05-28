const { Router } = require('express');
const { getPurchaseRecords, postPurchaseRecord } = require('../controllers/purchase-records.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/', requireAuth, requireRoles(ROLES.ADMIN), getPurchaseRecords);
routes.post('/', requireAuth, requireRoles(ROLES.ADMIN), postPurchaseRecord);

module.exports = routes;

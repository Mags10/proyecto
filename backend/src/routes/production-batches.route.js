const { Router } = require('express');
const {
  getProductionBatches,
  postProductionBatch,
  startProductionBatch,
  completeProductionBatch,
  cancelProductionBatch,
} = require('../controllers/production-batches.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), getProductionBatches);
routes.post('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), postProductionBatch);
routes.post('/:id/start', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), startProductionBatch);
routes.post('/:id/complete', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), completeProductionBatch);
routes.post('/:id/cancel', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), cancelProductionBatch);

module.exports = routes;

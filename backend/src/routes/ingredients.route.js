const { Router } = require('express');
const {
  getIngredients,
  getIngredientById,
  postIngredient,
  putIngredient,
  deleteIngredient,
} = require('../controllers/ingredients.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), getIngredients);
routes.get('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), getIngredientById);
routes.post('/', requireAuth, requireRoles(ROLES.ADMIN), postIngredient);
routes.put('/:id', requireAuth, requireRoles(ROLES.ADMIN), putIngredient);
routes.delete('/:id', requireAuth, requireRoles(ROLES.ADMIN), deleteIngredient);

module.exports = routes;

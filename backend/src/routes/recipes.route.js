const { Router } = require('express');
const {
  getRecipes,
  getRecipeById,
  postRecipe,
  putRecipe,
  deleteRecipe,
} = require('../controllers/recipes.controller');
const { ROLES, requireAuth, requireRoles } = require('../middlewares/auth.middleware');

const routes = Router();

routes.get('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN, ROLES.FLOOR), getRecipes);
routes.get('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN, ROLES.FLOOR), getRecipeById);
routes.post('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), postRecipe);
routes.put('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), putRecipe);
routes.delete('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.KITCHEN), deleteRecipe);

module.exports = routes;

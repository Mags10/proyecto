const { response, request } = require('express');
const { default: mongoose } = require('mongoose');
const Ingredient = require('../models/ingredient.model');
const Recipe = require('../models/recipe.model');

const roundMoney = (value) => Math.round(value * 100) / 100;

const deriveStatus = (margin) => {
  if (margin >= 30) {
    return 'Rentable';
  }

  if (margin >= 15) {
    return 'Ajustar costo';
  }

  return 'Crítica';
};

const normalizeRecipeIngredients = async (recipeIngredients = []) => {
  if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
    throw new Error('Recipe must include at least one ingredient');
  }

  const normalized = [];
  let totalCost = 0;

  for (const item of recipeIngredients) {
    const ingredientId = item.ingredientId || item.ingredient;
    const quantity = Number(item.quantity);

    if (!ingredientId || !mongoose.isValidObjectId(ingredientId)) {
      throw new Error(`Invalid ingredientId ${ingredientId}`);
    }

    if (!quantity || quantity <= 0) {
      throw new Error('Recipe ingredient quantity must be greater than zero');
    }

    const ingredient = await Ingredient.findOne({ _id: ingredientId, active: true });
    if (!ingredient) {
      throw new Error(`Ingredient with id ${ingredientId} not found`);
    }

    const requestedUnitCost = Number(item.unitCost);
    const unitCost = roundMoney(
      Number.isFinite(requestedUnitCost) && requestedUnitCost > 0
        ? requestedUnitCost
        : Number(ingredient.averageCost ?? 0)
    );
    const subtotal = roundMoney(quantity * unitCost);

    normalized.push({
      ingredient: ingredient._id,
      name: ingredient.name,
      unit: ingredient.unit,
      quantity,
      unitCost,
      subtotal,
    });

    totalCost += subtotal;
  }

  return { ingredients: normalized, totalCost: roundMoney(totalCost) };
};

const buildRecipeMetrics = (salePrice, totalCost) => {
  const price = Number(salePrice);
  const cost = Number(totalCost);
  const margin = price > 0 ? roundMoney(((price - cost) / price) * 100) : 0;

  return {
    margin,
    status: deriveStatus(margin),
  };
};

const getRecipes = async (req = request, res = response) => {
  const { q, limit } = req.query;

  try {
    const filter = { active: true };

    if (q) {
      filter.$or = [{ name: RegExp(q, 'i') }, { category: RegExp(q, 'i') }, { status: RegExp(q, 'i') }];
    }

    const result = await Recipe.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Number(limit) || 100);

    res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching recipes:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const getRecipeById = async (req = request, res = response) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const result = await Recipe.findOne({ _id: id, active: true });

    if (!result) {
      return res.status(404).json({
        message: `Recipe with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching recipe by id:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const postRecipe = async (req = request, res = response) => {
  const { name, category, salePrice, notes, yieldText, ingredients } = req.body;

  if (!name || !category || !salePrice) {
    return res.status(400).json({
      message: 'Bad Request. Missing required fields: name, category, salePrice',
      timestamp: new Date(),
    });
  }

  try {
    const normalized = await normalizeRecipeIngredients(ingredients);
    const metrics = buildRecipeMetrics(salePrice, normalized.totalCost);

    const recipe = new Recipe({
      name,
      category,
      salePrice: Number(salePrice),
      notes: notes || '',
      yieldText: yieldText || '1 porción',
      ingredients: normalized.ingredients,
      totalCost: normalized.totalCost,
      margin: metrics.margin,
      status: metrics.status,
    });

    const result = await recipe.save();

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: result,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error creating recipe:');
    console.log(err);

    if (err.message?.includes('Recipe must include')) {
      return res.status(400).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    if (err.message?.includes('Invalid ingredientId') || err.message?.includes('quantity')) {
      return res.status(400).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    if (err.message?.includes('Ingredient with id')) {
      return res.status(404).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const putRecipe = async (req = request, res = response) => {
  const { id } = req.params;
  const { name, category, salePrice, notes, yieldText, ingredients } = req.body;

  if (!name || !category || !salePrice) {
    return res.status(400).json({
      message: 'Bad Request. Missing required fields: name, category, salePrice',
      timestamp: new Date(),
    });
  }

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const existing = await Recipe.findOne({ _id: id, active: true });
    if (!existing) {
      return res.status(404).json({
        message: `Recipe with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    const normalized = await normalizeRecipeIngredients(ingredients);
    const metrics = buildRecipeMetrics(salePrice, normalized.totalCost);

    existing.name = name;
    existing.category = category;
    existing.salePrice = Number(salePrice);
    existing.notes = notes || '';
    existing.yieldText = yieldText || '1 porción';
    existing.ingredients = normalized.ingredients;
    existing.totalCost = normalized.totalCost;
    existing.margin = metrics.margin;
    existing.status = metrics.status;

    const result = await existing.save();

    res.status(200).json({
      message: 'Recipe updated successfully',
      recipe: result,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error updating recipe:');
    console.log(err);

    if (err.message?.includes('Recipe must include')) {
      return res.status(400).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    if (err.message?.includes('Invalid ingredientId') || err.message?.includes('quantity')) {
      return res.status(400).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    if (err.message?.includes('Ingredient with id')) {
      return res.status(404).json({
        message: err.message,
        timestamp: new Date(),
      });
    }

    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const deleteRecipe = async (req = request, res = response) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const result = await Recipe.findByIdAndUpdate(id, { active: false }, { new: true });

    if (!result) {
      return res.status(404).json({
        message: `Recipe with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      message: `Recipe with id ${id} deleted successfully`,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error deleting recipe:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  postRecipe,
  putRecipe,
  deleteRecipe,
};

const { response, request } = require('express');
const { default: mongoose } = require('mongoose');
const Recipe = require('../models/recipe.model');
const Sale = require('../models/sale.model');

const roundMoney = (value) => Math.round(value * 100) / 100;
const roundQuantity = (value) => Math.round(value * 1000) / 1000;

const getSales = async (req = request, res = response) => {
  const { recipeId, limit } = req.query;

  try {
    if (recipeId && !mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({
        message: `Invalid recipeId ${recipeId}`,
        timestamp: new Date()
      });
    }

    const filter = recipeId ? { 'items.recipe': recipeId } : {};
    const result = await Sale.find(filter)
      .sort({ soldAt: -1, createdAt: -1 })
      .limit(Number(limit) || 20);

    return res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching sales:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date()
    });
  }
};

const postSale = async (req = request, res = response) => {
  const { items, notes, soldAt } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Bad Request. items must include at least one line',
      timestamp: new Date()
    });
  }

  const aggregated = new Map();

  for (const item of items) {
    const recipeId = item.recipeId || item.recipe;
    const quantity = Number(item.quantity);

    if (!recipeId || !mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({
        message: `Invalid recipeId ${recipeId}`,
        timestamp: new Date()
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: 'Bad Request. Every sale line quantity must be greater than zero',
        timestamp: new Date()
      });
    }

    aggregated.set(recipeId, roundQuantity((aggregated.get(recipeId) || 0) + quantity));
  }

  try {
    const recipeIds = [...aggregated.keys()];
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      active: true
    });

    if (recipes.length !== recipeIds.length) {
      return res.status(404).json({
        message: 'One or more recipes are no longer available',
        timestamp: new Date()
      });
    }

    const recipeMap = new Map(recipes.map((recipe) => [String(recipe._id), recipe]));
    const insufficientItems = [];
    const saleItems = [];
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;

    for (const [recipeId, quantity] of aggregated.entries()) {
      const recipe = recipeMap.get(recipeId);
      const stockBefore = Number(recipe.currentStock || 0);

      if (stockBefore < quantity) {
        insufficientItems.push({
          recipeId,
          recipeName: recipe.name,
          requested: quantity,
          available: stockBefore
        });
        continue;
      }

      const unitPrice = roundMoney(Number(recipe.salePrice || 0));
      const unitCost = roundMoney(Number(recipe.totalCost || 0));
      const lineRevenue = roundMoney(quantity * unitPrice);
      const lineCost = roundMoney(quantity * unitCost);
      const stockAfter = roundQuantity(stockBefore - quantity);

      saleItems.push({
        recipe: recipe._id,
        recipeName: recipe.name,
        recipeCategory: recipe.category,
        quantity,
        unitPrice,
        unitCost,
        lineRevenue,
        lineCost,
        lineMargin: roundMoney(lineRevenue - lineCost),
        stockBefore,
        stockAfter
      });

      totalItems += quantity;
      totalRevenue += lineRevenue;
      totalCost += lineCost;
    }

    if (insufficientItems.length) {
      return res.status(409).json({
        message: 'Insufficient finished stock to register this sale',
        insufficientItems,
        timestamp: new Date()
      });
    }

    for (const item of saleItems) {
      const recipe = recipeMap.get(String(item.recipe));
      recipe.currentStock = item.stockAfter;
      await recipe.save();
    }

    const sale = new Sale({
      soldAt: soldAt ? new Date(soldAt) : new Date(),
      items: saleItems,
      totalItems: roundQuantity(totalItems),
      totalRevenue: roundMoney(totalRevenue),
      totalCost: roundMoney(totalCost),
      totalMargin: roundMoney(totalRevenue - totalCost),
      notes: notes || ''
    });

    const result = await sale.save();

    return res.status(201).json({
      message: 'Sale created successfully',
      sale: result,
      recipes,
      timestamp: new Date()
    });
  } catch (err) {
    console.log('Error creating sale:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date()
    });
  }
};

module.exports = {
  getSales,
  postSale
};

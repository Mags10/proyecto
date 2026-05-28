const { response, request } = require('express');
const { default: mongoose } = require('mongoose');
const Ingredient = require('../models/ingredient.model');
const Recipe = require('../models/recipe.model');
const ProductionBatch = require('../models/production-batch.model');

const roundMoney = (value) => Math.round(value * 100) / 100;
const roundQuantity = (value) => Math.round(value * 1000) / 1000;

const serializeLegacyPlannedIngredient = (item) => {
  const quantity = roundQuantity(
    Number(item.plannedQuantity ?? item.reservedQuantity ?? item.quantityConsumed ?? item.actualQuantity ?? 0)
  );
  const subtotal = roundMoney(Number(item.plannedSubtotal ?? item.actualSubtotal ?? item.subtotal ?? 0));
  const unitCost = Number(item.unitCost ?? 0);

  return {
    ingredient: item.ingredient,
    name: item.name,
    unit: item.unit,
    plannedQuantity: quantity,
    reservedQuantity: roundQuantity(Number(item.reservedQuantity ?? quantity)),
    unitCost,
    plannedSubtotal: subtotal,
    stockBefore: Number(item.stockBefore ?? 0),
    availableBefore: Number(item.availableBefore ?? item.stockBefore ?? 0),
  };
};

const serializeLegacyActualIngredient = (item) => {
  const plannedQuantity = roundQuantity(
    Number(item.plannedQuantity ?? item.quantityConsumed ?? item.actualQuantity ?? 0)
  );
  const actualQuantity = roundQuantity(Number(item.actualQuantity ?? item.quantityConsumed ?? 0));
  const actualSubtotal = roundMoney(Number(item.actualSubtotal ?? item.subtotal ?? 0));

  return {
    ingredient: item.ingredient,
    name: item.name,
    unit: item.unit,
    plannedQuantity,
    actualQuantity,
    varianceQuantity: roundQuantity(Number(item.varianceQuantity ?? actualQuantity - plannedQuantity)),
    unitCost: Number(item.unitCost ?? 0),
    actualSubtotal,
    wasteCost: roundMoney(Number(item.wasteCost ?? 0)),
    stockBefore: Number(item.stockBefore ?? 0),
    stockAfter: Number(item.stockAfter ?? Math.max(0, Number(item.stockBefore ?? 0) - actualQuantity)),
  };
};

const serializeProductionBatch = (batchDoc) => {
  const batch = typeof batchDoc.toObject === 'function' ? batchDoc.toObject() : batchDoc;

  const plannedIngredientsSource = batch.plannedIngredients?.length
    ? batch.plannedIngredients
    : batch.consumedIngredients || [];
  const actualIngredientsSource = batch.actualIngredients?.length
    ? batch.actualIngredients
    : batch.consumedIngredients || [];

  const plannedIngredients = plannedIngredientsSource.map(serializeLegacyPlannedIngredient);
  const actualIngredients = actualIngredientsSource.length
    ? actualIngredientsSource.map(serializeLegacyActualIngredient)
    : [];

  const inferredStatus =
    !batch.plannedIngredients?.length &&
    (batch.consumedIngredients?.length || batch.quantityProduced || batch.totalCost)
      ? 'COMPLETED'
      : batch.status || (actualIngredients.length || batch.newRecipeStock !== null ? 'COMPLETED' : 'PENDING');

  const plannedQuantity = Number(
    batch.plannedQuantity ?? batch.quantityProduced ?? batch.actualQuantity ?? 0
  );
  const actualQuantity =
    batch.actualQuantity ??
    (inferredStatus === 'COMPLETED' ? Number(batch.quantityProduced ?? plannedQuantity) : null);
  const plannedTotalCost = roundMoney(Number(batch.plannedTotalCost ?? batch.totalCost ?? 0));
  const actualTotalCost =
    batch.actualTotalCost ??
    (inferredStatus === 'COMPLETED' ? roundMoney(Number(batch.totalCost ?? plannedTotalCost)) : null);
  const previousRecipeStock = Number(batch.previousRecipeStock ?? 0);
  const newRecipeStock =
    batch.newRecipeStock ??
    (inferredStatus === 'COMPLETED'
      ? roundQuantity(previousRecipeStock + Number(actualQuantity || 0))
      : null);
  const unitCost = Number(
    batch.unitCost ?? (plannedQuantity > 0 ? roundMoney(plannedTotalCost / plannedQuantity) : 0)
  );

  return {
    ...batch,
    status: inferredStatus,
    plannedQuantity,
    actualQuantity,
    unitCost,
    plannedTotalCost,
    actualTotalCost,
    previousRecipeStock,
    newRecipeStock,
    plannedIngredients,
    actualIngredients,
    wasteSummary:
      batch.wasteSummary ??
      (inferredStatus === 'COMPLETED'
        ? {
            expectedYield: plannedQuantity,
            actualYield: Number(actualQuantity ?? 0),
            yieldVariance: roundQuantity(Number(actualQuantity ?? 0) - plannedQuantity),
            totalWasteCost: roundMoney(
              actualIngredients.reduce((acc, item) => acc + Number(item.wasteCost || 0), 0)
            ),
          }
        : null),
  };
};

const normalizeMongooseBatch = (batch) => {
  if (batch.plannedQuantity === undefined || batch.plannedQuantity === null) {
    batch.plannedQuantity = Number(batch.quantityProduced ?? batch.actualQuantity ?? 0);
  }
  if (batch.plannedTotalCost === undefined || batch.plannedTotalCost === null) {
    batch.plannedTotalCost = roundMoney(Number(batch.totalCost ?? 0));
  }
  if (batch.previousRecipeStock === undefined || batch.previousRecipeStock === null) {
    batch.previousRecipeStock = Number(batch.previousRecipeStock ?? 0);
  }
  if (batch.unitCost === undefined || batch.unitCost === null) {
    batch.unitCost = Number(
      batch.unitCost ??
        (batch.plannedQuantity > 0 ? roundMoney(batch.plannedTotalCost / batch.plannedQuantity) : 0)
    );
  }
  if (!batch.plannedIngredients || batch.plannedIngredients.length === 0) {
    const legacy = (batch.consumedIngredients || []).map(serializeLegacyPlannedIngredient);
    batch.plannedIngredients = legacy;
  }
  if (!batch.recipeName) {
    batch.recipeName = 'Receta';
  }
  if (!batch.recipeCategory) {
    batch.recipeCategory = 'General';
  }
};

const parseObjectId = (value, fieldName, res) => {
  if (!mongoose.isValidObjectId(value)) {
    res.status(400).json({
      message: `Invalid ${fieldName} ${value}`,
      timestamp: new Date(),
    });
    return null;
  }

  return value;
};

const findActiveRecipe = async (recipeId) => {
  return Recipe.findOne({ _id: recipeId, active: true });
};

const buildPlannedIngredients = (recipe, ingredientDocs, plannedQuantity) => {
  const ingredientMap = new Map(ingredientDocs.map((ingredient) => [String(ingredient._id), ingredient]));
  const plannedIngredients = [];
  const insufficientIngredients = [];

  for (const recipeIngredient of recipe.ingredients) {
    const ingredientDoc = ingredientMap.get(String(recipeIngredient.ingredient));
    if (!ingredientDoc) {
      insufficientIngredients.push({
        ingredientId: String(recipeIngredient.ingredient),
        name: recipeIngredient.name,
        required: roundQuantity(Number(recipeIngredient.quantity) * plannedQuantity),
        available: 0,
        unit: recipeIngredient.unit,
      });
      continue;
    }

    const stockBefore = Number(ingredientDoc.currentStock);
    const reservedBefore = Number(ingredientDoc.reservedStock || 0);
    const availableBefore = roundQuantity(stockBefore - reservedBefore);
    const plannedQty = roundQuantity(Number(recipeIngredient.quantity) * plannedQuantity);

    if (availableBefore < plannedQty) {
      insufficientIngredients.push({
        ingredientId: String(ingredientDoc._id),
        name: ingredientDoc.name,
        required: plannedQty,
        available: availableBefore,
        unit: ingredientDoc.unit,
      });
      continue;
    }

    plannedIngredients.push({
      ingredient: ingredientDoc._id,
      name: recipeIngredient.name,
      unit: recipeIngredient.unit,
      plannedQuantity: plannedQty,
      reservedQuantity: plannedQty,
      unitCost: recipeIngredient.unitCost,
      plannedSubtotal: roundMoney(plannedQty * recipeIngredient.unitCost),
      stockBefore,
      availableBefore,
    });
  }

  return { plannedIngredients, insufficientIngredients };
};

const reserveIngredients = async (plannedIngredients, ingredientDocs) => {
  const ingredientMap = new Map(ingredientDocs.map((ingredient) => [String(ingredient._id), ingredient]));

  for (const planned of plannedIngredients) {
    const ingredientDoc = ingredientMap.get(String(planned.ingredient));
    ingredientDoc.reservedStock = roundQuantity(
      Number(ingredientDoc.reservedStock || 0) + planned.reservedQuantity
    );
    await ingredientDoc.save();
  }
};

const releaseReservation = async (batch, ingredientDocs) => {
  const ingredientMap = new Map(ingredientDocs.map((ingredient) => [String(ingredient._id), ingredient]));

  for (const planned of batch.plannedIngredients) {
    const ingredientDoc = ingredientMap.get(String(planned.ingredient));
    if (!ingredientDoc) {
      continue;
    }

    ingredientDoc.reservedStock = Math.max(
      0,
      roundQuantity(Number(ingredientDoc.reservedStock || 0) - Number(planned.reservedQuantity || 0))
    );
    await ingredientDoc.save();
  }
};

const getProductionBatches = async (req = request, res = response) => {
  const { recipeId, limit, status } = req.query;

  try {
    if (recipeId && !mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({
        message: `Invalid recipeId ${recipeId}`,
        timestamp: new Date(),
      });
    }

    const filter = {};

    if (recipeId) {
      filter.recipe = recipeId;
    }

    if (status) {
      filter.status = status;
    }

    const result = await ProductionBatch.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 20);

    return res.status(200).json(result.map(serializeProductionBatch));
  } catch (err) {
    console.log('Error fetching production batches:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const postProductionBatch = async (req = request, res = response) => {
  const { recipeId, plannedQuantity, notes } = req.body;

  if (!recipeId || !plannedQuantity) {
    return res.status(400).json({
      message: 'Bad Request. Missing required fields: recipeId, plannedQuantity',
      timestamp: new Date(),
    });
  }

  if (!parseObjectId(recipeId, 'recipeId', res)) {
    return;
  }

  const quantity = Number(plannedQuantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: 'Bad Request. plannedQuantity must be greater than zero',
      timestamp: new Date(),
    });
  }

  try {
    const recipe = await findActiveRecipe(recipeId);

    if (!recipe) {
      return res.status(404).json({
        message: `Recipe with id ${recipeId} not found`,
        timestamp: new Date(),
      });
    }

    if (!recipe.ingredients.length) {
      return res.status(400).json({
        message: 'Recipe has no ingredients configured',
        timestamp: new Date(),
      });
    }

    const ingredientIds = recipe.ingredients.map((item) => item.ingredient);
    const ingredientDocs = await Ingredient.find({
      _id: { $in: ingredientIds },
      active: true,
    });

    if (ingredientDocs.length !== ingredientIds.length) {
      return res.status(404).json({
        message: 'One or more recipe ingredients are no longer available',
        timestamp: new Date(),
      });
    }

    const { plannedIngredients, insufficientIngredients } = buildPlannedIngredients(
      recipe,
      ingredientDocs,
      quantity
    );

    if (insufficientIngredients.length) {
      return res.status(409).json({
        message: 'Insufficient available stock to reserve this production order',
        insufficientIngredients,
        timestamp: new Date(),
      });
    }

    await reserveIngredients(plannedIngredients, ingredientDocs);

    const plannedTotalCost = roundMoney(
      plannedIngredients.reduce((acc, item) => acc + item.plannedSubtotal, 0)
    );
    const unitCost = quantity > 0 ? roundMoney(plannedTotalCost / quantity) : 0;

    const productionBatch = new ProductionBatch({
      recipe: recipe._id,
      recipeName: recipe.name,
      recipeCategory: recipe.category,
      status: 'PENDING',
      plannedQuantity: quantity,
      unitCost,
      plannedTotalCost,
      previousRecipeStock: Number(recipe.currentStock || 0),
      plannedIngredients,
      notes: notes || '',
    });

    const result = await productionBatch.save();

    return res.status(201).json({
      message: 'Production order created successfully',
      productionBatch: serializeProductionBatch(result),
      recipe,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error creating production batch:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const startProductionBatch = async (req = request, res = response) => {
  const { id } = req.params;

  if (!parseObjectId(id, 'id', res)) {
    return;
  }

  try {
    const batch = await ProductionBatch.findById(id);

    if (!batch) {
      return res.status(404).json({
        message: `Production batch with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    normalizeMongooseBatch(batch);

    if (batch.status !== 'PENDING') {
      return res.status(409).json({
        message: `Production batch cannot be started from status ${batch.status}`,
        timestamp: new Date(),
      });
    }

    batch.status = 'IN_PROGRESS';
    batch.startedAt = new Date();
    await batch.save();

    return res.status(200).json({
      message: 'Production batch started successfully',
      productionBatch: serializeProductionBatch(batch),
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error starting production batch:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const completeProductionBatch = async (req = request, res = response) => {
  const { id } = req.params;
  const { actualProduced, actualIngredients, durationMinutes, notes } = req.body;

  if (!parseObjectId(id, 'id', res)) {
    return;
  }

  const produced = Number(actualProduced);
  const providedDuration =
    durationMinutes !== undefined && durationMinutes !== null ? Number(durationMinutes) : null;

  if (!Number.isFinite(produced) || produced < 0) {
    return res.status(400).json({
      message: 'Bad Request. actualProduced must be zero or greater',
      timestamp: new Date(),
    });
  }

  if (providedDuration !== null && (!Number.isFinite(providedDuration) || providedDuration < 0)) {
    return res.status(400).json({
      message: 'Bad Request. durationMinutes must be zero or greater',
      timestamp: new Date(),
    });
  }

  try {
    const batch = await ProductionBatch.findById(id);

    if (!batch) {
      return res.status(404).json({
        message: `Production batch with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    normalizeMongooseBatch(batch);

    if (!['PENDING', 'IN_PROGRESS'].includes(batch.status)) {
      return res.status(409).json({
        message: `Production batch cannot be completed from status ${batch.status}`,
        timestamp: new Date(),
      });
    }

    const ingredientIds = batch.plannedIngredients.map((item) => item.ingredient);
    const ingredientDocs = await Ingredient.find({
      _id: { $in: ingredientIds },
      active: true,
    });
    const ingredientMap = new Map(ingredientDocs.map((ingredient) => [String(ingredient._id), ingredient]));

    if (ingredientDocs.length !== ingredientIds.length) {
      return res.status(404).json({
        message: 'One or more reserved ingredients are no longer available',
        timestamp: new Date(),
      });
    }

    const actualByIngredient = new Map(
      Array.isArray(actualIngredients)
        ? actualIngredients.map((item) => [
            String(item.ingredientId || item.ingredient),
            Number(item.actualQuantity),
          ])
        : []
    );

    const actualRows = [];
    let actualTotalCost = 0;
    let totalWasteCost = 0;

    for (const planned of batch.plannedIngredients) {
      const ingredientDoc = ingredientMap.get(String(planned.ingredient));
      const actualQuantityRaw = actualByIngredient.has(String(planned.ingredient))
        ? actualByIngredient.get(String(planned.ingredient))
        : Number(planned.plannedQuantity);
      const actualQuantity = roundQuantity(
        Number.isFinite(actualQuantityRaw) ? actualQuantityRaw : Number(planned.plannedQuantity)
      );

      if (actualQuantity < 0) {
        return res.status(400).json({
          message: `Invalid actualQuantity for ingredient ${planned.name}`,
          timestamp: new Date(),
        });
      }

      const stockBefore = Number(ingredientDoc.currentStock);
      if (stockBefore < actualQuantity) {
        return res.status(409).json({
          message: `Ingredient ${planned.name} no longer has enough stock to complete this order`,
          timestamp: new Date(),
        });
      }

      const stockAfter = roundQuantity(stockBefore - actualQuantity);
      const reservedAfter = Math.max(
        0,
        roundQuantity(Number(ingredientDoc.reservedStock || 0) - Number(planned.reservedQuantity || 0))
      );
      ingredientDoc.currentStock = stockAfter;
      ingredientDoc.reservedStock = reservedAfter;
      await ingredientDoc.save();

      const varianceQuantity = roundQuantity(actualQuantity - Number(planned.plannedQuantity));
      const actualSubtotal = roundMoney(actualQuantity * Number(planned.unitCost));
      const plannedSubtotal = roundMoney(Number(planned.plannedQuantity) * Number(planned.unitCost));
      const wasteCost = Math.max(0, roundMoney(actualSubtotal - plannedSubtotal));

      actualTotalCost += actualSubtotal;
      totalWasteCost += wasteCost;

      actualRows.push({
        ingredient: planned.ingredient,
        name: planned.name,
        unit: planned.unit,
        plannedQuantity: planned.plannedQuantity,
        actualQuantity,
        varianceQuantity,
        unitCost: planned.unitCost,
        actualSubtotal,
        wasteCost,
        stockBefore,
        stockAfter,
      });
    }

    const recipe = await Recipe.findById(batch.recipe);
    if (!recipe) {
      return res.status(404).json({
        message: `Recipe with id ${batch.recipe} not found`,
        timestamp: new Date(),
      });
    }

    const previousRecipeStock = Number(recipe.currentStock || 0);
    const newRecipeStock = roundQuantity(previousRecipeStock + produced);
    recipe.currentStock = newRecipeStock;
    await recipe.save();

    const completedAt = new Date();
    const derivedDuration = batch.startedAt
      ? Math.max(0, Math.round((completedAt.getTime() - new Date(batch.startedAt).getTime()) / 60000))
      : null;

    batch.status = 'COMPLETED';
    batch.actualQuantity = produced;
    batch.actualIngredients = actualRows;
    batch.actualTotalCost = roundMoney(actualTotalCost);
    batch.newRecipeStock = newRecipeStock;
    batch.completedAt = completedAt;
    batch.durationMinutes = providedDuration !== null ? providedDuration : derivedDuration;
    batch.notes = notes ?? batch.notes;
    batch.wasteSummary = {
      expectedYield: batch.plannedQuantity,
      actualYield: produced,
      yieldVariance: roundQuantity(produced - Number(batch.plannedQuantity)),
      totalWasteCost: roundMoney(totalWasteCost),
    };

    await batch.save();

    return res.status(200).json({
      message: 'Production batch completed successfully',
      productionBatch: serializeProductionBatch(batch),
      recipe,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error completing production batch:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const cancelProductionBatch = async (req = request, res = response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!parseObjectId(id, 'id', res)) {
    return;
  }

  try {
    const batch = await ProductionBatch.findById(id);

    if (!batch) {
      return res.status(404).json({
        message: `Production batch with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    normalizeMongooseBatch(batch);

    if (!['PENDING', 'IN_PROGRESS'].includes(batch.status)) {
      return res.status(409).json({
        message: `Production batch cannot be cancelled from status ${batch.status}`,
        timestamp: new Date(),
      });
    }

    const ingredientIds = batch.plannedIngredients.map((item) => item.ingredient);
    const ingredientDocs = await Ingredient.find({
      _id: { $in: ingredientIds },
      active: true,
    });

    await releaseReservation(batch, ingredientDocs);

    batch.status = 'CANCELLED';
    batch.cancelledAt = new Date();
    batch.cancellationReason = reason || '';
    await batch.save();

    return res.status(200).json({
      message: 'Production batch cancelled successfully',
      productionBatch: serializeProductionBatch(batch),
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error cancelling production batch:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

module.exports = {
  getProductionBatches,
  postProductionBatch,
  startProductionBatch,
  completeProductionBatch,
  cancelProductionBatch,
};

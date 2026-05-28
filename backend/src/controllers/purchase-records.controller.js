const { response, request } = require('express');
const { default: mongoose } = require('mongoose');
const Ingredient = require('../models/ingredient.model');
const PurchaseRecord = require('../models/purchase-record.model');

const roundMoney = (value) => Math.round(value * 100) / 100;

const getPurchaseRecords = async (req = request, res = response) => {
  const { ingredientId, limit } = req.query;

  try {
    if (ingredientId && !mongoose.isValidObjectId(ingredientId)) {
      return res.status(400).json({
        message: `Invalid ingredientId ${ingredientId}`,
        timestamp: new Date(),
      });
    }

    const filter = ingredientId ? { ingredient: ingredientId } : {};
    const result = await PurchaseRecord.find(filter)
      .populate('ingredient')
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 10);

    res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching purchase records:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const postPurchaseRecord = async (req = request, res = response) => {
  const { provider, invoiceDate, ingredientId, quantityReceived, totalPrice } = req.body;

  if (!provider || !invoiceDate || !ingredientId || !quantityReceived || !totalPrice) {
    return res.status(400).json({
      message:
        'Bad Request. Missing required fields: provider, invoiceDate, ingredientId, quantityReceived, totalPrice',
      timestamp: new Date(),
    });
  }

  if (!mongoose.isValidObjectId(ingredientId)) {
    return res.status(400).json({
      message: `Invalid ingredientId ${ingredientId}`,
      timestamp: new Date(),
    });
  }

  const received = Number(quantityReceived);
  const price = Number(totalPrice);

  if (received <= 0 || price <= 0) {
    return res.status(400).json({
      message: 'Bad Request. quantityReceived and totalPrice must be greater than zero',
      timestamp: new Date(),
    });
  }

  try {
    const ingredient = await Ingredient.findOne({ _id: ingredientId, active: true });
    if (!ingredient) {
      return res.status(404).json({
        message: `Ingredient with id ${ingredientId} not found`,
        timestamp: new Date(),
      });
    }

    const previousStock = ingredient.currentStock;
    const previousAverageCost = ingredient.averageCost;
    const unitPrice = roundMoney(price / received);
    const newStock = previousStock + received;
    const newAverageCost = roundMoney(
      (previousStock * previousAverageCost + received * unitPrice) / newStock
    );

    ingredient.currentStock = newStock;
    ingredient.averageCost = newAverageCost;
    await ingredient.save();

    const purchaseRecord = new PurchaseRecord({
      provider,
      invoiceDate,
      ingredient: ingredient._id,
      quantityReceived: received,
      totalPrice: price,
      unitPrice,
      previousStock,
      previousAverageCost,
      newStock,
      newAverageCost,
    });

    const result = await purchaseRecord.save();
    await result.populate('ingredient');

    res.status(201).json({
      message: 'Purchase record created successfully',
      purchaseRecord: result,
      ingredient,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error creating purchase record:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

module.exports = {
  getPurchaseRecords,
  postPurchaseRecord,
};

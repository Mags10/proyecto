const { response, request } = require('express');
const { default: mongoose } = require('mongoose');
const Ingredient = require('../models/ingredient.model');

const getIngredients = async (req = request, res = response) => {
  const { q, limit } = req.query;

  try {
    const filter = q ? { name: RegExp(q, 'i'), active: true } : { active: true };
    const result = await Ingredient.find(filter)
      .sort({ name: 1 })
      .limit(Number(limit) || 100);

    res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching ingredients:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const getIngredientById = async (req = request, res = response) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const result = await Ingredient.findOne({ _id: id, active: true });
    if (!result) {
      return res.status(404).json({
        message: `Ingredient with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.log('Error fetching ingredient by id:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const postIngredient = async (req = request, res = response) => {
  const { name, unit, currentStock, averageCost, minimumStock } = req.body;

  if (!name || !unit) {
    return res.status(400).json({
      message: 'Bad Request. Missing required fields: name, unit',
      timestamp: new Date(),
    });
  }

  try {
    const ingredient = new Ingredient({
      name,
      unit,
      currentStock: Number(currentStock) || 0,
      averageCost: Number(averageCost) || 0,
      minimumStock: Number(minimumStock) || 0,
    });

    const result = await ingredient.save();
    res.status(201).json({
      message: 'Ingredient created successfully',
      ingredient: result,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error creating ingredient:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const putIngredient = async (req = request, res = response) => {
  const { id } = req.params;
  const { name, unit, currentStock, averageCost, minimumStock } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const result = await Ingredient.findByIdAndUpdate(
      id,
      {
        name,
        unit,
        currentStock: Number(currentStock) || 0,
        averageCost: Number(averageCost) || 0,
        minimumStock: Number(minimumStock) || 0,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        message: `Ingredient with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      message: 'Ingredient updated successfully',
      ingredient: result,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error updating ingredient:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

const deleteIngredient = async (req = request, res = response) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid id ${id}`,
        timestamp: new Date(),
      });
    }

    const result = await Ingredient.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!result) {
      return res.status(404).json({
        message: `Ingredient with id ${id} not found`,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      message: `Ingredient with id ${id} deleted successfully`,
      timestamp: new Date(),
    });
  } catch (err) {
    console.log('Error deleting ingredient:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
};

module.exports = {
  getIngredients,
  getIngredientById,
  postIngredient,
  putIngredient,
  deleteIngredient,
};

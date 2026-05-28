const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    yieldText: {
      type: String,
      default: '1 porción',
      trim: true
    },
    ingredients: {
      type: [recipeIngredientSchema],
      required: true,
      default: []
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    },
    margin: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Rentable', 'Ajustar costo', 'Crítica'],
      default: 'Rentable'
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Recipe', recipeSchema);

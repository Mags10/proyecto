const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    recipeName: {
      type: String,
      required: true,
      trim: true,
    },
    recipeCategory: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    lineRevenue: {
      type: Number,
      required: true,
      min: 0,
    },
    lineCost: {
      type: Number,
      required: true,
      min: 0,
    },
    lineMargin: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    soldAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      default: [],
    },
    totalItems: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMargin: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);

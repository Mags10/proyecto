const mongoose = require('mongoose');

const plannedIngredientSchema = new mongoose.Schema(
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
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    plannedSubtotal: {
      type: Number,
      required: true,
      min: 0
    },
    stockBefore: {
      type: Number,
      required: true,
      min: 0
    },
    availableBefore: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const actualIngredientSchema = new mongoose.Schema(
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
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    actualQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    varianceQuantity: {
      type: Number,
      required: true
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    actualSubtotal: {
      type: Number,
      required: true,
      min: 0
    },
    wasteCost: {
      type: Number,
      required: true,
      min: 0
    },
    stockBefore: {
      type: Number,
      required: true,
      min: 0
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const wasteSummarySchema = new mongoose.Schema(
  {
    expectedYield: {
      type: Number,
      required: true,
      min: 0
    },
    actualYield: {
      type: Number,
      required: true,
      min: 0
    },
    yieldVariance: {
      type: Number,
      required: true
    },
    totalWasteCost: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const productionBatchSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true
    },
    recipeName: {
      type: String,
      required: true,
      trim: true
    },
    recipeCategory: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    },
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    actualQuantity: {
      type: Number,
      default: null,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    plannedTotalCost: {
      type: Number,
      required: true,
      min: 0
    },
    actualTotalCost: {
      type: Number,
      default: null,
      min: 0
    },
    previousRecipeStock: {
      type: Number,
      required: true,
      min: 0
    },
    newRecipeStock: {
      type: Number,
      default: null,
      min: 0
    },
    plannedIngredients: {
      type: [plannedIngredientSchema],
      required: true,
      default: []
    },
    actualIngredients: {
      type: [actualIngredientSchema],
      default: []
    },
    wasteSummary: {
      type: wasteSummarySchema,
      default: null
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);

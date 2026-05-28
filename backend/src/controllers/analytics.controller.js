const { request, response } = require('express');
const Ingredient = require('../models/ingredient.model');
const PurchaseRecord = require('../models/purchase-record.model');
const ProductionBatch = require('../models/production-batch.model');
const Recipe = require('../models/recipe.model');
const Sale = require('../models/sale.model');

const roundMoney = (value) => Math.round(value * 100) / 100;

const getDashboard = async (req = request, res = response) => {
  const days = Number(req.query.days || 30);
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - safeDays);

  try {
    const [
      activeIngredients,
      activeRecipes,
      recentPurchases,
      recentSales,
      productionBatches
    ] = await Promise.all([
      Ingredient.find({ active: true }).sort({ name: 1 }),
      Recipe.find({ active: true }).sort({ updatedAt: -1 }),
      PurchaseRecord.find({ createdAt: { $gte: fromDate } }).sort({ createdAt: -1 }),
      Sale.find({ soldAt: { $gte: fromDate } }).sort({ soldAt: -1 }),
      ProductionBatch.find({ createdAt: { $gte: fromDate } }).sort({ createdAt: -1 })
    ]);

    const totalSalesRevenue = roundMoney(recentSales.reduce((acc, sale) => acc + Number(sale.totalRevenue || 0), 0));
    const totalSalesCost = roundMoney(recentSales.reduce((acc, sale) => acc + Number(sale.totalCost || 0), 0));
    const grossMarginValue = roundMoney(totalSalesRevenue - totalSalesCost);
    const grossMarginPercent = totalSalesRevenue > 0
      ? roundMoney((grossMarginValue / totalSalesRevenue) * 100)
      : 0;
    const totalUnitsSold = recentSales.reduce((acc, sale) => acc + Number(sale.totalItems || 0), 0);

    const totalPurchaseSpend = roundMoney(recentPurchases.reduce((acc, purchase) => acc + Number(purchase.totalPrice || 0), 0));

    const completedBatches = productionBatches.filter((batch) => batch.status === 'COMPLETED');
    const activeProductionOrders = productionBatches.filter((batch) => ['PENDING', 'IN_PROGRESS'].includes(batch.status)).length;
    const totalProductionPlannedCost = roundMoney(completedBatches.reduce((acc, batch) => acc + Number(batch.actualTotalCost ?? batch.plannedTotalCost ?? 0), 0));
    const totalWasteCost = roundMoney(completedBatches.reduce((acc, batch) => acc + Number(batch.wasteSummary?.totalWasteCost || 0), 0));
    const completedProductionUnits = completedBatches.reduce((acc, batch) => acc + Number(batch.actualQuantity || 0), 0);

    const lowStockIngredients = activeIngredients
      .filter((ingredient) => Number(ingredient.currentStock) <= Number(ingredient.minimumStock))
      .map((ingredient) => ({
        _id: String(ingredient._id),
        name: ingredient.name,
        currentStock: Number(ingredient.currentStock),
        minimumStock: Number(ingredient.minimumStock),
        reservedStock: Number(ingredient.reservedStock || 0),
        unit: ingredient.unit
      }));

    const lowStockProducts = activeRecipes
      .filter((recipe) => Number(recipe.currentStock) > 0 && Number(recipe.currentStock) <= 5)
      .map((recipe) => ({
        _id: String(recipe._id),
        name: recipe.name,
        category: recipe.category,
        currentStock: Number(recipe.currentStock),
        salePrice: Number(recipe.salePrice),
        totalCost: Number(recipe.totalCost),
        margin: Number(recipe.margin)
      }));

    const lowMarginRecipes = activeRecipes
      .filter((recipe) => Number(recipe.margin) < 20)
      .sort((a, b) => Number(a.margin) - Number(b.margin))
      .slice(0, 5)
      .map((recipe) => ({
        _id: String(recipe._id),
        name: recipe.name,
        category: recipe.category,
        salePrice: Number(recipe.salePrice),
        totalCost: Number(recipe.totalCost),
        margin: Number(recipe.margin),
        currentStock: Number(recipe.currentStock)
      }));

    const salesByRecipe = new Map();

    for (const sale of recentSales) {
      for (const item of sale.items) {
        const key = String(item.recipe);
        const existing = salesByRecipe.get(key) || {
          recipeId: key,
          recipeName: item.recipeName,
          recipeCategory: item.recipeCategory,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          margin: 0
        };

        existing.unitsSold += Number(item.quantity || 0);
        existing.revenue += Number(item.lineRevenue || 0);
        existing.cost += Number(item.lineCost || 0);
        existing.margin += Number(item.lineMargin || 0);
        salesByRecipe.set(key, existing);
      }
    }

    const topSellingRecipes = [...salesByRecipe.values()]
      .map((item) => ({
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        recipeCategory: item.recipeCategory,
        unitsSold: item.unitsSold,
        revenue: roundMoney(item.revenue),
        cost: roundMoney(item.cost),
        margin: roundMoney(item.margin)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentSalesPreview = recentSales.slice(0, 5).map((sale) => ({
      _id: String(sale._id),
      soldAt: sale.soldAt,
      totalItems: Number(sale.totalItems || 0),
      totalRevenue: Number(sale.totalRevenue || 0),
      totalMargin: Number(sale.totalMargin || 0),
      itemCount: sale.items.length
    }));

    const recentProductionPreview = productionBatches.slice(0, 5).map((batch) => ({
      _id: String(batch._id),
      recipeName: batch.recipeName,
      status: batch.status,
      plannedQuantity: Number(batch.plannedQuantity || 0),
      actualQuantity: Number(batch.actualQuantity || 0),
      wasteCost: Number(batch.wasteSummary?.totalWasteCost || 0),
      createdAt: batch.createdAt,
      completedAt: batch.completedAt
    }));

    const salesTimelineMap = new Map();
    for (let index = safeDays - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      salesTimelineMap.set(key, {
        date: key,
        revenue: 0,
        margin: 0,
        units: 0
      });
    }

    for (const sale of recentSales) {
      const key = new Date(sale.soldAt).toISOString().slice(0, 10);
      const existing = salesTimelineMap.get(key);
      if (!existing) {
        continue;
      }

      existing.revenue += Number(sale.totalRevenue || 0);
      existing.margin += Number(sale.totalMargin || 0);
      existing.units += Number(sale.totalItems || 0);
    }

    const salesTimeline = [...salesTimelineMap.values()].map((item) => ({
      date: item.date,
      revenue: roundMoney(item.revenue),
      margin: roundMoney(item.margin),
      units: item.units
    }));

    const alerts = [
      ...lowStockIngredients.map((ingredient) => ({
        type: 'Stock de insumo',
        priority: ingredient.currentStock <= ingredient.minimumStock * 0.5 ? 'Alta' : 'Media',
        title: ingredient.name,
        detail: `Stock ${ingredient.currentStock} ${ingredient.unit}; mínimo ${ingredient.minimumStock} ${ingredient.unit}`
      })),
      ...lowMarginRecipes.map((recipe) => ({
        type: 'Margen bajo',
        priority: recipe.margin < 10 ? 'Alta' : 'Media',
        title: recipe.name,
        detail: `Margen ${recipe.margin}% con costo ${roundMoney(recipe.totalCost)} y precio ${roundMoney(recipe.salePrice)}`
      }))
    ].slice(0, 8);

    const productionStatusSummary = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => ({
      status,
      count: productionBatches.filter((batch) => batch.status === status).length
    }));

    const alertSummary = {
      high: alerts.filter((alert) => alert.priority === 'Alta').length,
      medium: alerts.filter((alert) => alert.priority === 'Media').length
    };

    return res.status(200).json({
      periodDays: safeDays,
      summary: {
        totalSalesRevenue,
        totalSalesCost,
        grossMarginValue,
        grossMarginPercent,
        totalUnitsSold,
        totalPurchaseSpend,
        totalProductionCost: totalProductionPlannedCost,
        totalWasteCost,
        activeProductionOrders,
        completedProductionUnits,
        sellableProducts: activeRecipes.filter((recipe) => Number(recipe.currentStock) > 0).length,
        lowStockIngredients: lowStockIngredients.length,
        lowStockProducts: lowStockProducts.length
      },
      lowStockIngredients,
      lowStockProducts,
      lowMarginRecipes,
      topSellingRecipes,
      recentSales: recentSalesPreview,
      recentProduction: recentProductionPreview,
      salesTimeline,
      productionStatusSummary,
      alertSummary,
      alerts,
      timestamp: new Date()
    });
  } catch (err) {
    console.log('Error building dashboard analytics:');
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error',
      timestamp: new Date()
    });
  }
};

module.exports = {
  getDashboard
};

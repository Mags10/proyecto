const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const connectDB = require('../src/config/database');
const Ingredient = require('../src/models/ingredient.model');
const PurchaseRecord = require('../src/models/purchase-record.model');
const Recipe = require('../src/models/recipe.model');

const roundMoney = (value) => Math.round(value * 100) / 100;

const minimumStockCaps = {
  litro: 24,
  kilogramo: 12,
  mililitro: 18,
  caja: 8,
  paquete: 8,
  pieza: 12,
};

const openingStockPattern = [0.9, 1.2, 0.65, 1.5, 0.35, 0.0];

const baseAverageCostByUnit = {
  litro: 12.4,
  kilogramo: 31.8,
  mililitro: 165,
  caja: 28.5,
  paquete: 18.2,
  pieza: 13.4,
};

const averageCostOverrides = {
  'Leche entera': 11.5,
  'Leche deslactosada': 12.2,
  'Leche light': 12.8,
  'Crema para batir': 18.6,
  'Crema para café': 15.4,
  'Half and half': 14.2,
  'Leche evaporada': 16.8,
  'Leche de almendra': 19.5,
  'Leche de avena': 18.9,
  'Bebida de soya': 17.4,
  'Agua filtrada': 1.2,
  'Agua mineral': 3.1,
  'Café arábica': 95,
  'Espresso blend': 92,
  'Café descafeinado': 88,
  'Café molido oscuro': 85,
  'Té negro': 40,
  'Té verde': 42,
  Matcha: 210,
  'Azúcar estándar': 22,
  'Azúcar mascabado': 24,
  'Harina de trigo': 31,
  'Harina de repostería': 34,
  'Cocoa en polvo': 78,
  'Jarabe de vainilla': 190,
  'Jarabe de caramelo': 185,
  'Jarabe de avellana': 205,
  'Jarabe de chocolate': 180,
  'Jarabe de fresa': 170,
  'Jarabe de menta': 160,
  'Jarabe chai': 175,
  'Jarabe maple': 215,
  'Extracto de vainilla': 240,
  'Extracto de almendra': 220,
  'Concentrado chai': 150,
  'Concentrado matcha': 240,
  Huevos: 4,
  Mantequilla: 18,
  'Queso crema': 26,
  Fresas: 14,
  Plátano: 7,
  Manzana: 8,
  Naranja: 6,
  Limón: 4,
  Mango: 12,
  Piña: 11,
  'Mora azul': 18,
  Zarzamora: 16,
  'Avena integral': 16,
  'Sal refinada': 7,
  'Canela molida': 14,
  Nuez: 42,
  Almendra: 38,
  'Vainilla en vaina': 240,
  'Chispas de chocolate': 29,
  'Cocoa nibs': 34,
  'Té negro en bolsitas': 24,
  'Té verde en bolsitas': 24,
  'Café soluble': 110,
  'Levadura seca': 28,
  'Canela en rama': 8,
  'Anís estrella': 12,
  'Hojas de menta': 5,
};

const openingStockOverrides = {
  'Leche entera': 20,
  'Leche deslactosada': 16,
  'Leche light': 8,
  'Crema para batir': 10,
  'Crema para café': 6,
  'Half and half': 5,
  'Leche evaporada': 4,
  'Leche de almendra': 12,
  'Leche de avena': 14,
  'Bebida de soya': 0,
  'Agua filtrada': 28,
  'Agua mineral': 18,
  'Café arábica': 14,
  'Espresso blend': 10,
  'Café descafeinado': 6,
  'Café molido oscuro': 4,
  'Té negro': 8,
  'Té verde': 6,
  Matcha: 3,
  'Azúcar estándar': 12,
  'Azúcar mascabado': 8,
  'Harina de trigo': 18,
  'Harina de repostería': 16,
  'Cocoa en polvo': 6,
  'Jarabe de vainilla': 10,
  'Jarabe de caramelo': 8,
  'Jarabe de avellana': 4,
  'Jarabe de chocolate': 5,
  'Jarabe de fresa': 3,
  'Jarabe de menta': 2,
  'Jarabe chai': 4,
  'Jarabe maple': 3,
  'Extracto de vainilla': 2,
  'Extracto de almendra': 2,
  'Concentrado chai': 5,
  'Concentrado matcha': 4,
  Huevos: 4,
  Mantequilla: 3,
  'Queso crema': 2,
  Fresas: 5,
  Plátano: 10,
  Manzana: 6,
  Naranja: 4,
  Limón: 8,
  Mango: 4,
  Piña: 2,
  'Mora azul': 2,
  Zarzamora: 2,
  'Avena integral': 5,
  'Sal refinada': 4,
  'Canela molida': 1,
  Nuez: 2,
  Almendra: 3,
  'Vainilla en vaina': 1,
  'Chispas de chocolate': 4,
  'Cocoa nibs': 2,
  'Té negro en bolsitas': 8,
  'Té verde en bolsitas': 6,
  'Café soluble': 3,
  'Levadura seca': 2,
  'Canela en rama': 2,
  'Anís estrella': 1,
  'Hojas de menta': 3,
};

function resolveMinimumStock(unit, baseMinimum) {
  const cap = minimumStockCaps[unit] ?? baseMinimum;
  return Math.max(1, Math.min(baseMinimum, cap));
}

function resolveOpeningStock(name, unit, minimumStock, index) {
  if (Object.prototype.hasOwnProperty.call(openingStockOverrides, name)) {
    return openingStockOverrides[name];
  }

  const pattern = openingStockPattern[index % openingStockPattern.length];
  return Math.max(0, Math.round(minimumStock * pattern));
}

function resolveAverageCost(name, unit, index) {
  if (Object.prototype.hasOwnProperty.call(averageCostOverrides, name)) {
    let val = Number(averageCostOverrides[name]);
    // If unit is mililitro but override looks like a per-liter price, convert to per-milliliter
    if (unit === 'mililitro' && val > 10) {
      val = val / 1000;
    }
    return roundMoney(val);
  }

  const base = baseAverageCostByUnit[unit] ?? 10;
  let computed = base * (1 + (index % 4) * 0.05);
  if (unit === 'mililitro' && computed > 10) {
    computed = computed / 1000;
  }
  return roundMoney(computed);
}

const ingredientCatalog = [
  {
    unit: 'litro',
    items: [
      ['Leche entera', 20],
      ['Leche deslactosada', 18],
      ['Leche light', 16],
      ['Crema para batir', 10],
      ['Crema para café', 12],
      ['Half and half', 10],
      ['Leche evaporada', 10],
      ['Leche de almendra', 12],
      ['Leche de avena', 12],
      ['Bebida de soya', 12],
      ['Agua filtrada', 30],
      ['Agua mineral', 24],
    ],
  },
  {
    unit: 'kilogramo',
    items: [
      ['Café arábica', 10],
      ['Espresso blend', 8],
      ['Café descafeinado', 6],
      ['Café molido oscuro', 8],
      ['Té negro', 4],
      ['Té verde', 4],
      ['Matcha', 3],
      ['Azúcar estándar', 15],
      ['Azúcar mascabado', 12],
      ['Harina de trigo', 20],
      ['Harina de repostería', 18],
      ['Cocoa en polvo', 8],
    ],
  },
  {
    unit: 'mililitro',
    items: [
      ['Jarabe de vainilla', 1500],
      ['Jarabe de caramelo', 1500],
      ['Jarabe de avellana', 1200],
      ['Jarabe de chocolate', 1200],
      ['Jarabe de fresa', 1000],
      ['Jarabe de menta', 1000],
      ['Jarabe chai', 1000],
      ['Jarabe maple', 1000],
      ['Extracto de vainilla', 800],
      ['Extracto de almendra', 800],
      ['Concentrado chai', 1000],
      ['Concentrado matcha', 1000],
    ],
  },
  {
    unit: 'caja',
    items: [
      ['Huevos', 6],
      ['Mantequilla', 6],
      ['Queso crema', 6],
      ['Fresas', 6],
      ['Plátano', 8],
      ['Manzana', 8],
      ['Naranja', 8],
      ['Limón', 10],
      ['Mango', 6],
      ['Piña', 4],
      ['Mora azul', 4],
      ['Zarzamora', 4],
    ],
  },
  {
    unit: 'paquete',
    items: [
      ['Avena integral', 8],
      ['Sal refinada', 10],
      ['Canela molida', 4],
      ['Nuez', 4],
      ['Almendra', 4],
      ['Vainilla en vaina', 3],
      ['Chispas de chocolate', 6],
      ['Cocoa nibs', 4],
      ['Té negro en bolsitas', 10],
      ['Té verde en bolsitas', 10],
      ['Café soluble', 6],
      ['Levadura seca', 6],
    ],
  },
  {
    unit: 'pieza',
    items: [
      ['Huevos', 6],
      ['Limones', 12],
      ['Naranjas', 12],
      ['Plátanos', 12],
      ['Mangos', 8],
      ['Fresas', 12],
      ['Manzanas', 12],
      ['Piñas', 6],
      ['Vainilla en vaina', 3],
      ['Canela en rama', 4],
      ['Anís estrella', 3],
      ['Hojas de menta', 8],
    ],
  },
];

const ingredientsSeed = ingredientCatalog.flatMap((group) =>
  group.items.map(([name, minimumStock], index) => {
    const resolvedMinimumStock = resolveMinimumStock(group.unit, minimumStock);

    return {
      name,
      unit: group.unit,
      minimumStock: resolvedMinimumStock,
      currentStock: resolveOpeningStock(name, group.unit, resolvedMinimumStock, index),
      averageCost: resolveAverageCost(name, group.unit, index),
    };
  })
);

const purchaseSeed = [
  {
    provider: 'Lácteos del Valle',
    invoiceDate: '2026-05-03',
    ingredientName: 'Leche entera',
    quantityReceived: 50,
    totalPrice: 520,
  },
  {
    provider: 'Distribuidora Central',
    invoiceDate: '2026-05-17',
    ingredientName: 'Leche entera',
    quantityReceived: 30,
    totalPrice: 360,
  },
  {
    provider: 'Lácteos del Valle',
    invoiceDate: '2026-05-08',
    ingredientName: 'Crema para batir',
    quantityReceived: 24,
    totalPrice: 480,
  },
  {
    provider: 'Distribuidora Central',
    invoiceDate: '2026-05-20',
    ingredientName: 'Crema para batir',
    quantityReceived: 18,
    totalPrice: 405,
  },
  {
    provider: 'Tostadores del Altiplano',
    invoiceDate: '2026-05-05',
    ingredientName: 'Café arábica',
    quantityReceived: 20,
    totalPrice: 1900,
  },
  {
    provider: 'Tostadores del Altiplano',
    invoiceDate: '2026-05-19',
    ingredientName: 'Café arábica',
    quantityReceived: 10,
    totalPrice: 1050,
  },
  {
    provider: 'Tostadores del Altiplano',
    invoiceDate: '2026-05-06',
    ingredientName: 'Espresso blend',
    quantityReceived: 18,
    totalPrice: 1710,
  },
  {
    provider: 'Mayorista La Dulcería',
    invoiceDate: '2026-05-10',
    ingredientName: 'Azúcar estándar',
    quantityReceived: 40,
    totalPrice: 760,
  },
  {
    provider: 'Mayorista La Dulcería',
    invoiceDate: '2026-05-21',
    ingredientName: 'Azúcar mascabado',
    quantityReceived: 36,
    totalPrice: 828,
  },
  {
    provider: 'Abarrotes San Miguel',
    invoiceDate: '2026-05-14',
    ingredientName: 'Harina de trigo',
    quantityReceived: 25,
    totalPrice: 675,
  },
  {
    provider: 'Abarrotes San Miguel',
    invoiceDate: '2026-05-27',
    ingredientName: 'Harina de repostería',
    quantityReceived: 20,
    totalPrice: 620,
  },
  {
    provider: 'Chocolate y Cacao SA',
    invoiceDate: '2026-05-11',
    ingredientName: 'Cocoa en polvo',
    quantityReceived: 12,
    totalPrice: 720,
  },
  {
    provider: 'Siropes del Centro',
    invoiceDate: '2026-05-12',
    ingredientName: 'Jarabe de vainilla',
    quantityReceived: 12,
    totalPrice: 2400,
  },
  {
    provider: 'Siropes del Centro',
    invoiceDate: '2026-05-24',
    ingredientName: 'Jarabe de caramelo',
    quantityReceived: 10,
    totalPrice: 2100,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-08',
    ingredientName: 'Fresas',
    quantityReceived: 6,
    totalPrice: 330,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-18',
    ingredientName: 'Plátano',
    quantityReceived: 8,
    totalPrice: 96,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-20',
    ingredientName: 'Mango',
    quantityReceived: 6,
    totalPrice: 180,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-21',
    ingredientName: 'Limones',
    quantityReceived: 16,
    totalPrice: 160,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-23',
    ingredientName: 'Naranjas',
    quantityReceived: 16,
    totalPrice: 192,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-25',
    ingredientName: 'Vainilla en vaina',
    quantityReceived: 6,
    totalPrice: 390,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-26',
    ingredientName: 'Canela en rama',
    quantityReceived: 8,
    totalPrice: 176,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-27',
    ingredientName: 'Anís estrella',
    quantityReceived: 4,
    totalPrice: 120,
  },
  {
    provider: 'Frutas del Bajío',
    invoiceDate: '2026-05-28',
    ingredientName: 'Hojas de menta',
    quantityReceived: 20,
    totalPrice: 180,
  },
];

const recipeSeed = [
  {
    name: 'Café Latte Grande',
    category: 'Bebidas',
    salePrice: 85,
    notes: 'Bebida caliente con base de espresso y leche vaporizada.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Café arábica', quantity: 0.018, unitCost: 95 },
      { ingredientName: 'Leche entera', quantity: 0.24, unitCost: 10.4 },
      { ingredientName: 'Jarabe de vainilla', quantity: 15, unitCost: 0.2 },
    ],
  },
  {
    name: 'Cappuccino Clásico',
    category: 'Bebidas',
    salePrice: 58,
    notes: 'Café espresso con espuma ligera y un toque de cacao.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Espresso blend', quantity: 0.02, unitCost: 92 },
      { ingredientName: 'Leche entera', quantity: 0.18, unitCost: 11.5 },
      { ingredientName: 'Cocoa en polvo', quantity: 0.006, unitCost: 78 },
    ],
  },
  {
    name: 'Latte Vainilla',
    category: 'Bebidas',
    salePrice: 74,
    notes: 'Latte dulce con vainilla y perfil suave para servicio continuo.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Espresso blend', quantity: 0.018, unitCost: 92 },
      { ingredientName: 'Leche deslactosada', quantity: 0.24, unitCost: 12.2 },
      { ingredientName: 'Jarabe de vainilla', quantity: 15, unitCost: 0.2 },
    ],
  },
  {
    name: 'Matcha Latte',
    category: 'Bebidas',
    salePrice: 78,
    notes: 'Bebida verde con leche de almendra y dulzor ligero.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Matcha', quantity: 0.015, unitCost: 210 },
      { ingredientName: 'Leche de almendra', quantity: 0.24, unitCost: 19.5 },
      { ingredientName: 'Azúcar mascabado', quantity: 0.012, unitCost: 24 },
    ],
  },
  {
    name: 'Chai Latte Vainilla',
    category: 'Bebidas',
    salePrice: 69,
    notes: 'Chai especiado con leche de avena y final aromático.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Concentrado chai', quantity: 0.02, unitCost: 150 },
      { ingredientName: 'Leche de avena', quantity: 0.24, unitCost: 18.9 },
      { ingredientName: 'Jarabe de vainilla', quantity: 10, unitCost: 0.2 },
    ],
  },
  {
    name: 'Croissant Clásico',
    category: 'Pastelería',
    salePrice: 35,
    notes: 'Hojaldre clásico con mantequilla y acabado dorado.',
    yieldText: '1 pieza',
    ingredients: [
      { ingredientName: 'Harina de repostería', quantity: 0.12, unitCost: 32 },
      { ingredientName: 'Mantequilla', quantity: 0.03, unitCost: 80 },
      { ingredientName: 'Huevos', quantity: 1, unitCost: 3 },
    ],
  },
  {
    name: 'Muffin Chocolate',
    category: 'Pastelería',
    salePrice: 48,
    notes: 'Muffin húmedo de chocolate con chispas y costra ligera.',
    yieldText: '1 pieza',
    ingredients: [
      { ingredientName: 'Harina de repostería', quantity: 0.09, unitCost: 34 },
      { ingredientName: 'Cocoa en polvo', quantity: 0.018, unitCost: 78 },
      { ingredientName: 'Chispas de chocolate', quantity: 0.03, unitCost: 29 },
      { ingredientName: 'Huevos', quantity: 1, unitCost: 4 },
    ],
  },
  {
    name: 'Pan Integral',
    category: 'Panadería',
    salePrice: 40,
    notes: 'Pan de caja integral con semillas y buena rotación de inventario.',
    yieldText: '1 pieza',
    ingredients: [
      { ingredientName: 'Harina de trigo', quantity: 0.18, unitCost: 30 },
      { ingredientName: 'Levadura seca', quantity: 0.004, unitCost: 40 },
      { ingredientName: 'Sal refinada', quantity: 0.002, unitCost: 15 },
    ],
  },
  {
    name: 'Tostada Integral con Mantequilla',
    category: 'Panadería',
    salePrice: 32,
    notes: 'Servicio sencillo y rápido para desayuno básico.',
    yieldText: '1 porción',
    ingredients: [
      { ingredientName: 'Harina de trigo', quantity: 0.08, unitCost: 31 },
      { ingredientName: 'Mantequilla', quantity: 0.015, unitCost: 18 },
      { ingredientName: 'Canela molida', quantity: 0.002, unitCost: 14 },
      { ingredientName: 'Azúcar estándar', quantity: 0.01, unitCost: 22 },
    ],
  },
  {
    name: 'Smoothie Tropical',
    category: 'Bebidas frías',
    salePrice: 62,
    notes: 'Smoothie de fruta fresca con base ligera y buena rotación.',
    yieldText: '1 vaso',
    ingredients: [
      { ingredientName: 'Leche de avena', quantity: 0.18, unitCost: 18.9 },
      { ingredientName: 'Mango', quantity: 2, unitCost: 12 },
      { ingredientName: 'Plátano', quantity: 1, unitCost: 7 },
      { ingredientName: 'Agua mineral', quantity: 0.12, unitCost: 3.1 },
      { ingredientName: 'Jarabe de fresa', quantity: 8, unitCost: 0.17 },
    ],
  },
  {
    name: 'Té Helado Cítrico',
    category: 'Bebidas frías',
    salePrice: 42,
    notes: 'Té ligero con cítricos y azúcar mascabado para refrescar.',
    yieldText: '1 vaso',
    ingredients: [
      { ingredientName: 'Té verde', quantity: 0.003, unitCost: 42 },
      { ingredientName: 'Limón', quantity: 2, unitCost: 4 },
      { ingredientName: 'Azúcar mascabado', quantity: 0.015, unitCost: 24 },
      { ingredientName: 'Agua filtrada', quantity: 0.3, unitCost: 1.2 },
    ],
  },
  {
    name: 'Muffin Arándano',
    category: 'Pastelería',
    salePrice: 45,
    notes: 'Muffin de mantequilla con fruta y topping sencillo.',
    yieldText: '1 pieza',
    ingredients: [
      { ingredientName: 'Harina de repostería', quantity: 0.1, unitCost: 32 },
      { ingredientName: 'Mora azul', quantity: 0.025, unitCost: 120 },
      { ingredientName: 'Azúcar estándar', quantity: 0.03, unitCost: 20 },
      { ingredientName: 'Huevos', quantity: 1, unitCost: 3 },
    ],
  },
];

function getIngredientPurchaseHistory(name) {
  return purchaseSeed.filter((purchase) => purchase.ingredientName === name);
}

async function applyPurchase(ingredient, purchaseInput) {
  const previousStock = ingredient.currentStock || 0;
  const previousAverageCost = ingredient.averageCost || 0;
  const unitPrice = roundMoney(purchaseInput.totalPrice / purchaseInput.quantityReceived);
  const newStock = previousStock + purchaseInput.quantityReceived;
  const newAverageCost = roundMoney(
    (previousStock * previousAverageCost + purchaseInput.quantityReceived * unitPrice) / newStock
  );

  const purchaseRecord = new PurchaseRecord({
    provider: purchaseInput.provider,
    invoiceDate: purchaseInput.invoiceDate,
    ingredient: ingredient._id,
    quantityReceived: purchaseInput.quantityReceived,
    totalPrice: purchaseInput.totalPrice,
    unitPrice,
    previousStock,
    previousAverageCost,
    newStock,
    newAverageCost,
  });

  ingredient.currentStock = newStock;
  ingredient.averageCost = newAverageCost;

  await ingredient.save();
  await purchaseRecord.save();
}

async function seedRecipes(ingredientMap) {
  const recipeDocs = [];

  for (const recipeInput of recipeSeed) {
    const normalizedIngredients = [];
    let totalCost = 0;

    for (const item of recipeInput.ingredients) {
      const ingredient = ingredientMap.get(item.ingredientName);
      if (!ingredient) {
        continue;
      }

      const unitCost = roundMoney(Number(item.unitCost ?? ingredient.averageCost ?? 0));
      const subtotal = roundMoney(item.quantity * unitCost);

      normalizedIngredients.push({
        ingredient: ingredient._id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: item.quantity,
        unitCost,
        subtotal,
      });

      totalCost += subtotal;
    }

    const salePrice = recipeInput.salePrice;
    const margin = salePrice > 0 ? roundMoney(((salePrice - totalCost) / salePrice) * 100) : 0;
    const status = margin >= 30 ? 'Rentable' : margin >= 15 ? 'Ajustar costo' : 'Crítica';

    recipeDocs.push({
      name: recipeInput.name,
      category: recipeInput.category,
      salePrice,
      notes: recipeInput.notes,
      yieldText: recipeInput.yieldText,
      ingredients: normalizedIngredients,
      currentStock: Math.max(0, Math.round((recipeDocs.length % 5) * 3)),
      totalCost: roundMoney(totalCost),
      margin,
      status,
      active: true,
    });
  }

  await Recipe.deleteMany({});
  await Recipe.insertMany(recipeDocs);
}

async function main() {
  await connectDB();

  const connection = mongoose.connection;
  if (connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      connection.once('connected', resolve);
      connection.once('error', reject);
    });
  }

  await PurchaseRecord.deleteMany({});
  await Ingredient.deleteMany({});

  const createdIngredients = await Ingredient.insertMany(
    ingredientsSeed.map((ingredient) => ({
      ...ingredient,
      active: true,
    }))
  );

  const ingredientMap = new Map(createdIngredients.map((ingredient) => [ingredient.name, ingredient]));

  for (const ingredientName of ingredientMap.keys()) {
    const ingredient = ingredientMap.get(ingredientName);
    const purchases = getIngredientPurchaseHistory(ingredientName);

    for (const purchaseInput of purchases) {
      await applyPurchase(ingredient, purchaseInput);
    }
  }

  await seedRecipes(ingredientMap);

  console.log('Seeding de insumos, compras y recetas completado con éxito.');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Error ejecutando el seeder de abastecimiento:');
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error('No se pudo cerrar la conexión a MongoDB:');
    console.error(disconnectError);
  }

  process.exit(1);
});

const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'KitchenFlow API',
    version: '1.0.0',
    description: 'API para control de insumos, abastecimiento, recetas, producción y ventas.',
  },
  servers: [
    {
      url: 'http://localhost:3010',
      description: 'Servidor local',
    },
  ],
  tags: [
    {
      name: 'Status',
      description: 'Estado del backend',
    },
    {
      name: 'Auth',
      description: 'Autenticación y sesión',
    },
    {
      name: 'Ingredients',
      description: 'Inventario de insumos',
    },
    {
      name: 'PurchaseRecords',
      description: 'Registro de compras y recalculo WAC',
    },
    {
      name: 'Recipes',
      description: 'Recetas, costeo y margen',
    },
    {
      name: 'ProductionBatches',
      description: 'Produccion de lotes y consumo de insumos',
    },
    {
      name: 'Sales',
      description: 'Ventas de producto terminado y descuento de stock',
    },
    {
      name: 'Analytics',
      description: 'Indicadores operativos y financieros del dashboard',
    },
  ],
  paths: {
    '/api/status': {
      get: {
        tags: ['Status'],
        summary: 'Obtiene el estado del backend',
        responses: {
          200: {
            description: 'Backend disponible',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StatusResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicia sesión y devuelve token de acceso',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtiene el usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Sesión vigente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/ingredients': {
      get: {
        tags: ['Ingredients'],
        summary: 'Lista insumos activos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtro por nombre',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Cantidad maxima de resultados',
          },
        ],
        responses: {
          200: {
            description: 'Lista de insumos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Ingredient' },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['Ingredients'],
        summary: 'Crea un insumo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateIngredientInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Insumo creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IngredientMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/ingredients/{id}': {
      get: {
        tags: ['Ingredients'],
        summary: 'Obtiene un insumo por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        responses: {
          200: {
            description: 'Insumo encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Ingredient' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      put: {
        tags: ['Ingredients'],
        summary: 'Actualiza un insumo',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateIngredientInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Insumo actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IngredientMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      delete: {
        tags: ['Ingredients'],
        summary: 'Desactiva un insumo',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        responses: {
          200: {
            description: 'Insumo desactivado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/purchase-records': {
      get: {
        tags: ['PurchaseRecords'],
        summary: 'Lista compras registradas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'ingredientId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              pattern: '^[a-fA-F0-9]{24}$',
            },
            description: 'Filtra compras por insumo',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Cantidad maxima de resultados',
          },
        ],
        responses: {
          200: {
            description: 'Lista de compras',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PurchaseRecord' },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['PurchaseRecords'],
        summary: 'Registra una compra y recalcula WAC',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePurchaseRecordInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Compra registrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PurchaseRecordMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'Lista recetas activas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtro por nombre, categoría o estado',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Cantidad maxima de resultados',
          },
        ],
        responses: {
          200: {
            description: 'Lista de recetas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Recipe' },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['Recipes'],
        summary: 'Crea una receta con costeo calculado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRecipeInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Receta creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecipeMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/recipes/{id}': {
      get: {
        tags: ['Recipes'],
        summary: 'Obtiene una receta por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        responses: {
          200: {
            description: 'Receta encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Recipe' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      put: {
        tags: ['Recipes'],
        summary: 'Actualiza una receta',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRecipeInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Receta actualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecipeMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'Desactiva una receta',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        responses: {
          200: {
            description: 'Receta desactivada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/production-batches': {
      get: {
        tags: ['ProductionBatches'],
        summary: 'Lista ordenes de produccion registradas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'recipeId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              pattern: '^[a-fA-F0-9]{24}$',
            },
            description: 'Filtra lotes por receta',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            },
            description: 'Filtra ordenes por estado',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Cantidad maxima de resultados',
          },
        ],
        responses: {
          200: {
            description: 'Lista de lotes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ProductionBatch' },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['ProductionBatches'],
        summary: 'Crea una orden de produccion y aparta insumos',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductionBatchInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Lote de produccion creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductionBatchMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/production-batches/{id}/start': {
      post: {
        tags: ['ProductionBatches'],
        summary: 'Inicia una orden de produccion apartada',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        responses: {
          200: {
            description: 'Orden iniciada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductionBatchMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/production-batches/{id}/complete': {
      post: {
        tags: ['ProductionBatches'],
        summary: 'Completa una orden con resultados reales y mermas',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompleteProductionBatchInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Orden completada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductionBatchMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/production-batches/{id}/cancel': {
      post: {
        tags: ['ProductionBatches'],
        summary: 'Cancela una orden y libera insumos apartados',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/ObjectId' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CancelProductionBatchInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Orden cancelada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductionBatchMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/sales': {
      get: {
        tags: ['Sales'],
        summary: 'Lista ventas registradas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'recipeId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              pattern: '^[a-fA-F0-9]{24}$',
            },
            description: 'Filtra ventas por receta',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
            description: 'Cantidad maxima de resultados',
          },
        ],
        responses: {
          200: {
            description: 'Lista de ventas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Sale' },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['Sales'],
        summary: 'Registra una venta y descuenta stock terminado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSaleInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Venta registrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaleMutationResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Obtiene indicadores operativos y financieros del dashboard',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'days',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 365 },
            description: 'Ventana en días para calcular métricas recientes',
          },
        ],
        responses: {
          200: {
            description: 'Resumen del dashboard',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardAnalytics' },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      ObjectId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{24}$',
        },
        description: 'ObjectId de MongoDB',
      },
    },
    responses: {
      BadRequest: {
        description: 'Solicitud invalida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
          },
        },
      },
      Unauthorized: {
        description: 'No autenticado o token inválido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
          },
        },
      },
      InternalServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessageResponse' },
          },
        },
      },
    },
    schemas: {
      StatusResponse: {
        type: 'object',
        required: ['status', 'message', 'timestamp'],
        properties: {
          status: { type: 'string', example: 'ok' },
          message: { type: 'string', example: 'Backend is running and connected to MongoDB' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message', 'timestamp'],
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      AuthUser: {
        type: 'object',
        required: ['_id', 'name', 'email', 'role'],
        properties: {
          _id: { type: 'string', example: '665900000000000000000001' },
          name: { type: 'string', example: 'Administrador KitchenFlow' },
          email: { type: 'string', format: 'email', example: 'admin@kitchenflow.local' },
          role: { type: 'string', enum: ['ADMIN', 'KITCHEN', 'FLOOR'] },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@kitchenflow.local' },
          password: { type: 'string', example: 'Admin123!' },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['accessToken', 'tokenType', 'expiresIn', 'user', 'timestamp'],
        properties: {
          accessToken: { type: 'string' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'number', example: 43200 },
          user: { $ref: '#/components/schemas/AuthUser' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      MeResponse: {
        type: 'object',
        required: ['user', 'timestamp'],
        properties: {
          user: { $ref: '#/components/schemas/AuthUser' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Ingredient: {
        type: 'object',
        required: [
          '_id',
          'name',
          'unit',
          'currentStock',
          'reservedStock',
          'averageCost',
          'minimumStock',
          'active',
        ],
        properties: {
          _id: { type: 'string', example: '665100000000000000000001' },
          name: { type: 'string', example: 'Leche entera' },
          unit: { type: 'string', example: 'litro' },
          currentStock: { type: 'number', example: 120 },
          reservedStock: { type: 'number', example: 8 },
          averageCost: { type: 'number', example: 11.58 },
          minimumStock: { type: 'number', example: 20 },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateIngredientInput: {
        type: 'object',
        required: ['name', 'unit'],
        properties: {
          name: { type: 'string', example: 'Leche entera' },
          unit: { type: 'string', example: 'litro' },
          currentStock: { type: 'number', minimum: 0, default: 0 },
          averageCost: { type: 'number', minimum: 0, default: 0 },
          minimumStock: { type: 'number', minimum: 0, default: 0 },
        },
      },
      IngredientMutationResponse: {
        type: 'object',
        required: ['message', 'ingredient', 'timestamp'],
        properties: {
          message: { type: 'string' },
          ingredient: { $ref: '#/components/schemas/Ingredient' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      PurchaseRecord: {
        type: 'object',
        required: [
          '_id',
          'provider',
          'invoiceDate',
          'ingredient',
          'quantityReceived',
          'totalPrice',
          'unitPrice',
          'previousStock',
          'previousAverageCost',
          'newStock',
          'newAverageCost',
        ],
        properties: {
          _id: { type: 'string', example: '665200000000000000000001' },
          provider: { type: 'string', example: 'Lacteos del Valle' },
          invoiceDate: { type: 'string', format: 'date-time' },
          ingredient: { $ref: '#/components/schemas/Ingredient' },
          quantityReceived: { type: 'number', example: 20 },
          totalPrice: { type: 'number', example: 240 },
          unitPrice: { type: 'number', example: 12 },
          previousStock: { type: 'number', example: 100 },
          previousAverageCost: { type: 'number', example: 11.5 },
          newStock: { type: 'number', example: 120 },
          newAverageCost: { type: 'number', example: 11.58 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePurchaseRecordInput: {
        type: 'object',
        required: ['provider', 'invoiceDate', 'ingredientId', 'quantityReceived', 'totalPrice'],
        properties: {
          provider: { type: 'string', example: 'Lacteos del Valle' },
          invoiceDate: { type: 'string', format: 'date', example: '2026-05-25' },
          ingredientId: { type: 'string', example: '665100000000000000000001' },
          quantityReceived: { type: 'number', minimum: 0, example: 20 },
          totalPrice: { type: 'number', minimum: 0, example: 240 },
        },
      },
      PurchaseRecordMutationResponse: {
        type: 'object',
        required: ['message', 'purchaseRecord', 'ingredient', 'timestamp'],
        properties: {
          message: { type: 'string' },
          purchaseRecord: { $ref: '#/components/schemas/PurchaseRecord' },
          ingredient: { $ref: '#/components/schemas/Ingredient' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      RecipeIngredient: {
        type: 'object',
        required: ['ingredient', 'name', 'unit', 'quantity', 'unitCost', 'subtotal'],
        properties: {
          ingredient: { type: 'string', example: '665100000000000000000001' },
          name: { type: 'string', example: 'Leche entera' },
          unit: { type: 'string', example: 'litro' },
          quantity: { type: 'number', example: 240 },
          unitCost: { type: 'number', example: 11.58 },
          subtotal: { type: 'number', example: 27.79 },
        },
      },
      Recipe: {
        type: 'object',
        required: [
          '_id',
          'name',
          'category',
          'salePrice',
          'notes',
          'yieldText',
          'ingredients',
          'currentStock',
          'totalCost',
          'margin',
          'status',
          'active',
        ],
        properties: {
          _id: { type: 'string', example: '665300000000000000000001' },
          name: { type: 'string', example: 'Café Latte Grande' },
          category: { type: 'string', example: 'Bebidas' },
          salePrice: { type: 'number', example: 85 },
          notes: { type: 'string', example: 'Receta base para bebidas calientes' },
          yieldText: { type: 'string', example: '1 porción' },
          ingredients: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecipeIngredient' },
          },
          currentStock: { type: 'number', example: 12 },
          totalCost: { type: 'number', example: 43.25 },
          margin: { type: 'number', example: 49.12 },
          status: { type: 'string', enum: ['Rentable', 'Ajustar costo', 'Crítica'], example: 'Rentable' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateRecipeInput: {
        type: 'object',
        required: ['name', 'category', 'salePrice', 'ingredients'],
        properties: {
          name: { type: 'string', example: 'Café Latte Grande' },
          category: { type: 'string', example: 'Bebidas' },
          salePrice: { type: 'number', minimum: 0, example: 85 },
          notes: { type: 'string', example: 'Receta base para bebidas calientes' },
          yieldText: { type: 'string', example: '1 porción' },
          ingredients: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['ingredientId', 'quantity'],
              properties: {
                ingredientId: { type: 'string', example: '665100000000000000000001' },
                quantity: { type: 'number', minimum: 0, example: 240 },
                unitCost: { type: 'number', minimum: 0, example: 11.58 },
              },
            },
          },
        },
      },
      RecipeMutationResponse: {
        type: 'object',
        required: ['message', 'recipe', 'timestamp'],
        properties: {
          message: { type: 'string' },
          recipe: { $ref: '#/components/schemas/Recipe' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ProductionBatchPlannedIngredient: {
        type: 'object',
        required: [
          'ingredient',
          'name',
          'unit',
          'plannedQuantity',
          'reservedQuantity',
          'unitCost',
          'plannedSubtotal',
          'stockBefore',
          'availableBefore',
        ],
        properties: {
          ingredient: { type: 'string', example: '665100000000000000000001' },
          name: { type: 'string', example: 'Leche entera' },
          unit: { type: 'string', example: 'litro' },
          plannedQuantity: { type: 'number', example: 2.4 },
          reservedQuantity: { type: 'number', example: 2.4 },
          unitCost: { type: 'number', example: 11.58 },
          plannedSubtotal: { type: 'number', example: 27.79 },
          stockBefore: { type: 'number', example: 20 },
          availableBefore: { type: 'number', example: 20 },
        },
      },
      ProductionBatchActualIngredient: {
        type: 'object',
        required: [
          'ingredient',
          'name',
          'unit',
          'plannedQuantity',
          'actualQuantity',
          'varianceQuantity',
          'unitCost',
          'actualSubtotal',
          'wasteCost',
          'stockBefore',
          'stockAfter',
        ],
        properties: {
          ingredient: { type: 'string', example: '665100000000000000000001' },
          name: { type: 'string', example: 'Leche entera' },
          unit: { type: 'string', example: 'litro' },
          plannedQuantity: { type: 'number', example: 2.4 },
          actualQuantity: { type: 'number', example: 2.6 },
          varianceQuantity: { type: 'number', example: 0.2 },
          unitCost: { type: 'number', example: 11.58 },
          actualSubtotal: { type: 'number', example: 30.11 },
          wasteCost: { type: 'number', example: 2.32 },
          stockBefore: { type: 'number', example: 20 },
          stockAfter: { type: 'number', example: 17.6 },
        },
      },
      ProductionWasteSummary: {
        type: 'object',
        required: ['expectedYield', 'actualYield', 'yieldVariance', 'totalWasteCost'],
        properties: {
          expectedYield: { type: 'number', example: 10 },
          actualYield: { type: 'number', example: 9 },
          yieldVariance: { type: 'number', example: -1 },
          totalWasteCost: { type: 'number', example: 12.45 },
        },
      },
      ProductionBatch: {
        type: 'object',
        required: [
          '_id',
          'recipe',
          'recipeName',
          'recipeCategory',
          'status',
          'plannedQuantity',
          'unitCost',
          'plannedTotalCost',
          'previousRecipeStock',
          'plannedIngredients',
        ],
        properties: {
          _id: { type: 'string', example: '665400000000000000000001' },
          recipe: { type: 'string', example: '665300000000000000000001' },
          recipeName: { type: 'string', example: 'Café Latte Grande' },
          recipeCategory: { type: 'string', example: 'Bebidas' },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            example: 'IN_PROGRESS',
          },
          plannedQuantity: { type: 'number', example: 10 },
          actualQuantity: { type: 'number', nullable: true, example: 9 },
          unitCost: { type: 'number', example: 43.25 },
          plannedTotalCost: { type: 'number', example: 432.5 },
          actualTotalCost: { type: 'number', nullable: true, example: 438.6 },
          previousRecipeStock: { type: 'number', example: 8 },
          newRecipeStock: { type: 'number', nullable: true, example: 17 },
          plannedIngredients: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductionBatchPlannedIngredient' },
          },
          actualIngredients: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductionBatchActualIngredient' },
          },
          wasteSummary: {
            nullable: true,
            allOf: [{ $ref: '#/components/schemas/ProductionWasteSummary' }],
          },
          notes: { type: 'string', example: 'Horneado con lote parcial' },
          cancellationReason: { type: 'string', example: 'Falla de equipo' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          cancelledAt: { type: 'string', format: 'date-time', nullable: true },
          durationMinutes: { type: 'number', nullable: true, example: 48 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductionBatchInput: {
        type: 'object',
        required: ['recipeId', 'plannedQuantity'],
        properties: {
          recipeId: { type: 'string', example: '665300000000000000000001' },
          plannedQuantity: { type: 'number', minimum: 0, example: 10 },
          notes: { type: 'string', example: 'Preparacion para vitrina matutina' },
        },
      },
      CompleteProductionBatchInput: {
        type: 'object',
        required: ['actualProduced'],
        properties: {
          actualProduced: { type: 'number', minimum: 0, example: 9 },
          durationMinutes: { type: 'number', minimum: 0, example: 48 },
          notes: { type: 'string', example: 'Una pieza salio quemada' },
          actualIngredients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['ingredientId', 'actualQuantity'],
              properties: {
                ingredientId: { type: 'string', example: '665100000000000000000001' },
                actualQuantity: { type: 'number', minimum: 0, example: 2.6 },
              },
            },
          },
        },
      },
      CancelProductionBatchInput: {
        type: 'object',
        properties: {
          reason: { type: 'string', example: 'Se cancelo por falta de personal' },
        },
      },
      ProductionBatchMutationResponse: {
        type: 'object',
        required: ['message', 'productionBatch', 'recipe', 'timestamp'],
        properties: {
          message: { type: 'string' },
          productionBatch: { $ref: '#/components/schemas/ProductionBatch' },
          recipe: { $ref: '#/components/schemas/Recipe' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      SaleItem: {
        type: 'object',
        required: [
          'recipe',
          'recipeName',
          'recipeCategory',
          'quantity',
          'unitPrice',
          'unitCost',
          'lineRevenue',
          'lineCost',
          'lineMargin',
          'stockBefore',
          'stockAfter',
        ],
        properties: {
          recipe: { type: 'string', example: '665300000000000000000001' },
          recipeName: { type: 'string', example: 'Café Latte Grande' },
          recipeCategory: { type: 'string', example: 'Bebidas' },
          quantity: { type: 'number', example: 2 },
          unitPrice: { type: 'number', example: 85 },
          unitCost: { type: 'number', example: 43.25 },
          lineRevenue: { type: 'number', example: 170 },
          lineCost: { type: 'number', example: 86.5 },
          lineMargin: { type: 'number', example: 83.5 },
          stockBefore: { type: 'number', example: 12 },
          stockAfter: { type: 'number', example: 10 },
        },
      },
      Sale: {
        type: 'object',
        required: [
          '_id',
          'soldAt',
          'items',
          'totalItems',
          'totalRevenue',
          'totalCost',
          'totalMargin',
          'notes',
        ],
        properties: {
          _id: { type: 'string', example: '665500000000000000000001' },
          soldAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/SaleItem' },
          },
          totalItems: { type: 'number', example: 3 },
          totalRevenue: { type: 'number', example: 255 },
          totalCost: { type: 'number', example: 129.75 },
          totalMargin: { type: 'number', example: 125.25 },
          notes: { type: 'string', example: 'Venta en turno matutino' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateSaleInput: {
        type: 'object',
        required: ['items'],
        properties: {
          soldAt: { type: 'string', format: 'date-time' },
          notes: { type: 'string', example: 'Pedido para mesa 4' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['recipeId', 'quantity'],
              properties: {
                recipeId: { type: 'string', example: '665300000000000000000001' },
                quantity: { type: 'number', minimum: 0, example: 2 },
              },
            },
          },
        },
      },
      SaleMutationResponse: {
        type: 'object',
        required: ['message', 'sale', 'recipes', 'timestamp'],
        properties: {
          message: { type: 'string' },
          sale: { $ref: '#/components/schemas/Sale' },
          recipes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Recipe' },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      DashboardAlert: {
        type: 'object',
        required: ['type', 'priority', 'title', 'detail'],
        properties: {
          type: { type: 'string', example: 'Margen bajo' },
          priority: { type: 'string', enum: ['Alta', 'Media'], example: 'Alta' },
          title: { type: 'string', example: 'Café Latte Grande' },
          detail: { type: 'string', example: 'Margen 12% con costo 43.25 y precio 49.00' },
        },
      },
      DashboardLowStockIngredient: {
        type: 'object',
        required: ['_id', 'name', 'currentStock', 'minimumStock', 'reservedStock', 'unit'],
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          currentStock: { type: 'number' },
          minimumStock: { type: 'number' },
          reservedStock: { type: 'number' },
          unit: { type: 'string' },
        },
      },
      DashboardProductSummary: {
        type: 'object',
        required: ['_id', 'name', 'category', 'currentStock', 'salePrice', 'totalCost', 'margin'],
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          currentStock: { type: 'number' },
          salePrice: { type: 'number' },
          totalCost: { type: 'number' },
          margin: { type: 'number' },
        },
      },
      DashboardTopSellingRecipe: {
        type: 'object',
        required: ['recipeId', 'recipeName', 'recipeCategory', 'unitsSold', 'revenue', 'cost', 'margin'],
        properties: {
          recipeId: { type: 'string' },
          recipeName: { type: 'string' },
          recipeCategory: { type: 'string' },
          unitsSold: { type: 'number' },
          revenue: { type: 'number' },
          cost: { type: 'number' },
          margin: { type: 'number' },
        },
      },
      DashboardRecentSale: {
        type: 'object',
        required: ['_id', 'soldAt', 'totalItems', 'totalRevenue', 'totalMargin', 'itemCount'],
        properties: {
          _id: { type: 'string' },
          soldAt: { type: 'string', format: 'date-time' },
          totalItems: { type: 'number' },
          totalRevenue: { type: 'number' },
          totalMargin: { type: 'number' },
          itemCount: { type: 'number' },
        },
      },
      DashboardRecentProduction: {
        type: 'object',
        required: [
          '_id',
          'recipeName',
          'status',
          'plannedQuantity',
          'actualQuantity',
          'wasteCost',
          'createdAt',
        ],
        properties: {
          _id: { type: 'string' },
          recipeName: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          plannedQuantity: { type: 'number' },
          actualQuantity: { type: 'number' },
          wasteCost: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      DashboardSalesTimelinePoint: {
        type: 'object',
        required: ['date', 'revenue', 'margin', 'units'],
        properties: {
          date: { type: 'string', example: '2026-05-28' },
          revenue: { type: 'number' },
          margin: { type: 'number' },
          units: { type: 'number' },
        },
      },
      DashboardProductionStatusSummaryItem: {
        type: 'object',
        required: ['status', 'count'],
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          count: { type: 'number' },
        },
      },
      DashboardAlertSummary: {
        type: 'object',
        required: ['high', 'medium'],
        properties: {
          high: { type: 'number' },
          medium: { type: 'number' },
        },
      },
      DashboardSummary: {
        type: 'object',
        required: [
          'totalSalesRevenue',
          'totalSalesCost',
          'grossMarginValue',
          'grossMarginPercent',
          'totalUnitsSold',
          'totalPurchaseSpend',
          'totalProductionCost',
          'totalWasteCost',
          'activeProductionOrders',
          'completedProductionUnits',
          'sellableProducts',
          'lowStockIngredients',
          'lowStockProducts',
        ],
        properties: {
          totalSalesRevenue: { type: 'number' },
          totalSalesCost: { type: 'number' },
          grossMarginValue: { type: 'number' },
          grossMarginPercent: { type: 'number' },
          totalUnitsSold: { type: 'number' },
          totalPurchaseSpend: { type: 'number' },
          totalProductionCost: { type: 'number' },
          totalWasteCost: { type: 'number' },
          activeProductionOrders: { type: 'number' },
          completedProductionUnits: { type: 'number' },
          sellableProducts: { type: 'number' },
          lowStockIngredients: { type: 'number' },
          lowStockProducts: { type: 'number' },
        },
      },
      DashboardAnalytics: {
        type: 'object',
        required: [
          'periodDays',
          'summary',
          'lowStockIngredients',
          'lowStockProducts',
          'lowMarginRecipes',
          'topSellingRecipes',
          'recentSales',
          'recentProduction',
          'alerts',
          'timestamp',
        ],
        properties: {
          periodDays: { type: 'number' },
          summary: { $ref: '#/components/schemas/DashboardSummary' },
          lowStockIngredients: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardLowStockIngredient' },
          },
          lowStockProducts: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardProductSummary' },
          },
          lowMarginRecipes: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardProductSummary' },
          },
          topSellingRecipes: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardTopSellingRecipe' },
          },
          recentSales: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardRecentSale' },
          },
          recentProduction: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardRecentProduction' },
          },
          salesTimeline: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardSalesTimelinePoint' },
          },
          productionStatusSummary: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardProductionStatusSummaryItem' },
          },
          alertSummary: {
            $ref: '#/components/schemas/DashboardAlertSummary',
          },
          alerts: {
            type: 'array',
            items: { $ref: '#/components/schemas/DashboardAlert' },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

module.exports = openapiDocument;

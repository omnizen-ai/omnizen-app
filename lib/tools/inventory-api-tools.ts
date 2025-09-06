import { tool } from 'ai';
import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api/client';

// Helper to get current user context
interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

// Helper function to resolve product by name
async function resolveProductByName(productName: string): Promise<string | null> {
  try {
    const params = { search: productName, limit: 5 };
    const data = await apiClient.get<{ products: Product[]; total: number }>('/api/sales/products', params);
    
    if (data.products && data.products.length > 0) {
      return data.products[0].id;
    }
    return null;
  } catch (error) {
    console.error('[resolveProductByName] Error:', error);
    return null;
  }
}

// Type definitions for inventory operations
interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unitPrice: string;
  cost: string;
  quantityOnHand: number;
  reorderPoint: number;
  isActive: boolean;
  category?: string;
}

interface InventoryLevel {
  id: string;
  productId: string;
  warehouseId: string;
  product?: Product;
  warehouse?: Warehouse;
  quantityOnHand: string;
  quantityAvailable: string;
  quantityReserved: string;
  reorderPoint?: string;
  unitCost?: string;
  lastCountDate?: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  isDefault: boolean;
  isActive: boolean;
}

interface StockMove {
  id: string;
  productId: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: string;
  type: string;
  reason: string;
  moveDate: string;
  reference?: string;
}

/**
 * Get inventory levels with filtering
 */
export const createGetInventoryLevelsApiTool = (context: UserContext) => tool({
  description: 'Get current inventory levels across warehouses with optional filtering. Fast API-based retrieval for stock queries.',
  inputSchema: z.object({
    warehouseId: z.string().uuid().optional().describe('Filter by specific warehouse ID'),
    productId: z.string().uuid().optional().describe('Filter by specific product ID'),
    productName: z.string().optional().describe('Filter by product name (will resolve to product ID)'),
    lowStock: z.boolean().optional().describe('Only show items with low stock (below reorder point)'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of inventory levels to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ warehouseId, productId, productName, lowStock, limit, offset }) => {
    try {
      // If productName provided but not productId, resolve product first
      let resolvedProductId = productId;
      if (productName && !productId) {
        const productIdResult = await resolveProductByName(productName);
        if (!productIdResult) {
          return {
            success: false,
            error: `No product found matching "${productName}"`,
          };
        }
        resolvedProductId = productIdResult;
      }

      const params: Record<string, any> = { limit, offset };
      if (warehouseId) params.warehouseId = warehouseId;
      if (resolvedProductId) params.productId = resolvedProductId;
      if (lowStock !== undefined) params.lowStock = lowStock;

      const data = await apiClient.get<{ levels: InventoryLevel[]; total: number }>('/api/inventory/levels', params);
      
      return {
        success: true,
        data: data.levels,
        total: data.total,
        message: `Found ${data.total} inventory levels${productName ? ` for product "${productName}"` : ''}${lowStock ? ' with low stock' : ''}`,
      };
    } catch (error) {
      console.error('[getInventoryLevels] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch inventory levels',
      };
    }
  },
});

/**
 * Get warehouses with filtering
 */
export const createGetWarehousesApiTool = (context: UserContext) => tool({
  description: 'Get warehouses with optional filtering. Fast API-based retrieval for warehouse information.',
  inputSchema: z.object({
    search: z.string().optional().describe('Search term to filter warehouses by name or location'),
    isActive: z.boolean().optional().describe('Filter by active status'),
    isDefault: z.boolean().optional().describe('Filter by default warehouse status'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of warehouses to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ search, isActive, isDefault, limit, offset }) => {
    try {
      const params: Record<string, any> = { limit, offset };
      if (search) params.search = search;
      if (isActive !== undefined) params.isActive = isActive;
      if (isDefault !== undefined) params.isDefault = isDefault;

      const data = await apiClient.get<{ warehouses: Warehouse[]; total: number }>('/api/inventory/warehouses', params);
      
      return {
        success: true,
        data: data.warehouses,
        total: data.total,
        message: `Found ${data.total} warehouses${search ? ` matching "${search}"` : ''}`,
      };
    } catch (error) {
      console.error('[getWarehouses] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch warehouses',
      };
    }
  },
});

/**
 * Get stock movements with filtering
 */
export const createGetStockMovesApiTool = (context: UserContext) => tool({
  description: 'Get stock movement history with filtering by product, warehouse, or date range. Fast API-based retrieval.',
  inputSchema: z.object({
    productId: z.string().uuid().optional().describe('Filter by specific product ID'),
    productName: z.string().optional().describe('Filter by product name (will resolve to product ID)'),
    warehouseId: z.string().uuid().optional().describe('Filter by specific warehouse ID'),
    moveType: z.enum(['in', 'out', 'transfer', 'adjustment']).optional().describe('Filter by movement type'),
    dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD format)'),
    dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD format)'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of movements to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ productId, productName, warehouseId, moveType, dateFrom, dateTo, limit, offset }) => {
    try {
      // If productName provided but not productId, resolve product first
      let resolvedProductId = productId;
      if (productName && !productId) {
        const productParams = { search: productName, limit: 5 };
        const productData = await apiClient.get<{ products: Product[]; total: number }>('/api/sales/products', productParams);
        
        if (productData.products && productData.products.length > 0) {
          resolvedProductId = productData.products[0].id;
        } else {
          return {
            success: false,
            error: `No product found matching "${productName}"`,
          };
        }
      }

      const params: Record<string, any> = { limit, offset };
      if (resolvedProductId) params.productId = resolvedProductId;
      if (warehouseId) params.warehouseId = warehouseId;
      if (moveType) params.moveType = moveType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const data = await apiClient.get<{ moves: StockMove[]; total: number }>('/api/inventory/moves', params);
      
      return {
        success: true,
        data: data.moves,
        total: data.total,
        message: `Found ${data.total} stock movements${productName ? ` for product "${productName}"` : ''}${moveType ? ` of type "${moveType}"` : ''}`,
      };
    } catch (error) {
      console.error('[getStockMoves] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch stock movements',
      };
    }
  },
});

/**
 * Create inventory level (add product to warehouse)
 */
export const createCreateInventoryLevelApiTool = (context: UserContext) => tool({
  description: 'Create a new inventory level entry for a product in a warehouse. Fast API-based creation.',
  inputSchema: z.object({
    warehouseId: z.string().uuid().describe('Warehouse ID where product will be tracked'),
    productId: z.string().uuid().describe('Product ID to track'),
    quantityOnHand: z.string().default('0').describe('Initial quantity on hand'),
    quantityReserved: z.string().default('0').describe('Initial quantity reserved'),
    reorderPoint: z.string().optional().describe('Reorder point for this product at this warehouse'),
    unitCost: z.string().optional().describe('Unit cost for this inventory'),
  }),
  execute: async ({ warehouseId, productId, quantityOnHand, quantityReserved, reorderPoint, unitCost }) => {
    try {
      const inventoryData = {
        warehouseId,
        productId,
        quantityOnHand,
        quantityReserved,
        reorderPoint,
        unitCost,
      };

      const data = await apiClient.post<{ level: InventoryLevel }>('/api/inventory/levels', inventoryData);
      
      return {
        success: true,
        data: data.level,
        message: `Inventory level created successfully for product in warehouse`,
      };
    } catch (error) {
      console.error('[createInventoryLevel] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to create inventory level',
      };
    }
  },
});

/**
 * Get low stock report
 */
export const createGetLowStockReportApiTool = (context: UserContext) => tool({
  description: 'Get products that are below their reorder points across all warehouses. Fast API-based report generation.',
  inputSchema: z.object({
    warehouseId: z.string().uuid().optional().describe('Filter by specific warehouse ID'),
    productCategory: z.string().optional().describe('Filter by product category'),
    limit: z.number().min(1).max(100).default(50).describe('Maximum number of low stock items to return'),
  }),
  execute: async ({ warehouseId, productCategory, limit }) => {
    try {
      const params: Record<string, any> = { lowStock: true, limit };
      if (warehouseId) params.warehouseId = warehouseId;
      if (productCategory) params.category = productCategory;

      const data = await apiClient.get<{ levels: InventoryLevel[]; total: number }>('/api/inventory/levels', params);
      
      // Calculate restock recommendations
      const lowStockItems = data.levels.map(level => ({
        ...level,
        quantityNeeded: level.reorderPoint 
          ? Math.max(0, parseFloat(level.reorderPoint) - parseFloat(level.quantityOnHand))
          : 0,
        stockDays: level.product ? estimateStockDays(level) : 0,
      }));

      return {
        success: true,
        data: lowStockItems,
        total: data.total,
        message: `Found ${data.total} products with low stock${warehouseId ? ' in specified warehouse' : ''}`,
        summary: {
          totalLowStockItems: data.total,
          criticalItems: lowStockItems.filter(item => item.quantityNeeded > 0).length,
          totalRestockValue: lowStockItems.reduce((sum, item) => 
            sum + (item.quantityNeeded * parseFloat(item.unitCost || '0')), 0
          ),
        },
      };
    } catch (error) {
      console.error('[getLowStockReport] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to generate low stock report',
      };
    }
  },
});

// Helper function to estimate stock days (simplified)
function estimateStockDays(level: InventoryLevel): number {
  // This is a simplified calculation - in reality you'd look at usage history
  const currentStock = parseFloat(level.quantityOnHand);
  const reorderPoint = parseFloat(level.reorderPoint || '0');
  
  if (reorderPoint <= 0) return 999; // No reorder point set
  if (currentStock <= 0) return 0; // Out of stock
  
  // Estimate based on how close to reorder point (rough estimate)
  return Math.round((currentStock / reorderPoint) * 30); // Assume 30 days at reorder point
}

// Export all inventory API tools as a collection
export function createInventoryApiTools(context: UserContext) {
  return {
    getInventoryLevels: createGetInventoryLevelsApiTool(context),
    getWarehouses: createGetWarehousesApiTool(context),
    getStockMoves: createGetStockMovesApiTool(context),
    createInventoryLevel: createCreateInventoryLevelApiTool(context),
    getLowStockReport: createGetLowStockReportApiTool(context),
  };
}
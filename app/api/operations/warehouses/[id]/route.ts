import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse 
} from '@/lib/db/queries/warehouses';
import { z } from 'zod';

// Schema for warehouse update
const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['physical', 'virtual', 'dropship', 'consignment']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  managerId: z.string().uuid().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  operatingHours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }).optional(),
  capacity: z.object({
    maxWeight: z.string().optional(),
    maxVolume: z.string().optional(),
    maxPallets: z.number().optional(),
  }).optional(),
  zones: z.array(z.object({
    name: z.string(),
    type: z.string(),
    capacity: z.number().optional(),
  })).optional(),
  settings: z.object({
    allowNegativeStock: z.boolean().optional(),
    autoReorderEnabled: z.boolean().optional(),
    requireReceiptConfirmation: z.boolean().optional(),
    requireShipmentConfirmation: z.boolean().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const warehouse = await getWarehouseById(id, organizationId);
    
    if (!warehouse) {
      return ApiResponse.error('Warehouse not found', 404);
    }
    
    return ApiResponse.success(warehouse);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updateWarehouseSchema.parse(body);
    
    const warehouse = await updateWarehouse(id, organizationId, validatedData);
    
    if (!warehouse) {
      return ApiResponse.error('Warehouse not found', 404);
    }
    
    return ApiResponse.success(warehouse);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    // First check if the warehouse exists
    const existing = await getWarehouseById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Warehouse not found', 404);
    }
    
    await deleteWarehouse(id, organizationId);
    
    return ApiResponse.success({ message: 'Warehouse deleted successfully' });
  });
});
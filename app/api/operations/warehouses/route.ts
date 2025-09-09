import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getWarehouses, 
  createWarehouse,
  getWarehouseSummary
} from '@/lib/db/queries/warehouses';
import { z } from 'zod';

// Schema for warehouse creation
const createWarehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['physical', 'virtual', 'dropship', 'consignment']).default('physical'),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  managerId: z.string().uuid().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street1: z.string().default(''),
    street2: z.string().default(''),
    city: z.string().default(''),
    state: z.string().default(''),
    postalCode: z.string().default(''),
    country: z.string().default(''),
  }).default({
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  }),
  operatingHours: z.object({
    monday: z.string().default('9:00 AM - 5:00 PM'),
    tuesday: z.string().default('9:00 AM - 5:00 PM'),
    wednesday: z.string().default('9:00 AM - 5:00 PM'),
    thursday: z.string().default('9:00 AM - 5:00 PM'),
    friday: z.string().default('9:00 AM - 5:00 PM'),
    saturday: z.string().default('Closed'),
    sunday: z.string().default('Closed'),
  }).default({
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: 'Closed',
    sunday: 'Closed',
  }),
  capacity: z.object({
    maxWeight: z.string().optional(),
    maxVolume: z.string().optional(),
    maxPallets: z.number().optional(),
  }).optional(),
  zones: z.array(z.object({
    name: z.string(),
    type: z.string(),
    capacity: z.number().optional(),
  })).default([]),
  settings: z.object({
    allowNegativeStock: z.boolean().default(false),
    autoReorderEnabled: z.boolean().default(true),
    requireReceiptConfirmation: z.boolean().default(true),
    requireShipmentConfirmation: z.boolean().default(true),
  }).default({
    allowNegativeStock: false,
    autoReorderEnabled: true,
    requireReceiptConfirmation: true,
    requireShipmentConfirmation: true,
  }),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  customFields: z.record(z.any()).default({}),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return warehouse summary
    if (summary === 'true') {
      const summaryData = await getWarehouseSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getWarehouses(organizationId, {
      type,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      search,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createWarehouseSchema.parse(body);
    
    const warehouse = await createWarehouse({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);
    
    return ApiResponse.success(warehouse, 201);
  });
});


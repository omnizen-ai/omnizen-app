import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getProducts, 
  createProduct, 
  getProductSummary 
} from '@/lib/db/queries/sales';
import { z } from 'zod';

// Schema for product creation
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  upc: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),
  purchasePrice: z.string().default('0'),
  salePrice: z.string().default('0'),
  retailPrice: z.string().default('0'),
  wholesalePrice: z.string().default('0'),
  minimumPrice: z.string().default('0'),
  costOfGoodsSold: z.string().default('0'),
  taxable: z.boolean().default(true),
  taxCategoryId: z.string().uuid().optional(),
  preferredVendorId: z.string().uuid().optional(),
  reorderPoint: z.number().default(0),
  reorderQuantity: z.number().default(0),
  leadTimeDays: z.number().default(0),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    unit: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  customFields: z.record(z.any()).default({}),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status');
    const summary = searchParams.get('summary');

    // If summary is requested, return product summary
    if (summary === 'true') {
      const summaryData = await getProductSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getProducts(organizationId, {
      type,
      category,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      search,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);
    
    const product = await createProduct({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);
    
    return ApiResponse.success(product, 201);
  });
});


import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getProductById,
  updateProduct,
  deleteProduct 
} from '@/lib/db/queries/sales';
import { z } from 'zod';

// Schema for product update
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  upc: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  isService: z.boolean().optional(),
  isActive: z.boolean().optional(),
  purchasePrice: z.string().optional(),
  salePrice: z.string().optional(),
  retailPrice: z.string().optional(),
  wholesalePrice: z.string().optional(),
  minimumPrice: z.string().optional(),
  costOfGoodsSold: z.string().optional(),
  taxable: z.boolean().optional(),
  taxCategoryId: z.string().uuid().optional(),
  preferredVendorId: z.string().uuid().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional(),
  leadTimeDays: z.number().optional(),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    unit: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const product = await getProductById(id, organizationId);
    
    if (!product) {
      return ApiResponse.error('Product not found', 404);
    }
    
    return ApiResponse.success(product);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    
    const product = await updateProduct(id, organizationId, validatedData);
    
    if (!product) {
      return ApiResponse.error('Product not found', 404);
    }
    
    return ApiResponse.success(product);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    // First check if the product exists
    const existing = await getProductById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Product not found', 404);
    }
    
    await deleteProduct(id, organizationId);
    
    return ApiResponse.success({ message: 'Product deleted successfully' });
  });
});
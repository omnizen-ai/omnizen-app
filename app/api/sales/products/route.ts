import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductSummary 
} from '@/lib/db/queries/sales';

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
    const body = await request.json();
    
    const productData = {
      ...body,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newProduct = await createProduct(productData);
    return ApiResponse.success(newProduct, 201);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return ApiResponse.badRequest('Product ID required');
    }

    const updatedProduct = await updateProduct(id, organizationId, updateData);

    if (!updatedProduct) {
      return ApiResponse.notFound('Product not found');
    }

    return ApiResponse.success(updatedProduct);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Product ID required');
    }

    const deletedProduct = await deleteProduct(id, organizationId);

    if (!deletedProduct) {
      return ApiResponse.notFound('Product not found');
    }

    return ApiResponse.success({ success: true });
  });
});
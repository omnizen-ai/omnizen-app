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

// Type definitions leveraging existing API schemas
interface Contact {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  type: 'customer' | 'vendor' | 'both';
  customerType: 'individual' | 'business';
  isActive: boolean;
  creditLimit: string;
  paymentTerms?: string;
  taxId?: string;
  notes?: string;
  billingAddress?: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Contact;
  orderDate: string;
  dueDate?: string;
  status: string;
  total: string;
  notes?: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: Contact;
  quotationDate: string;
  validUntil?: string;
  status: string;
  total: string;
  notes?: string;
}

/**
 * Get customer contacts with filtering and search
 */
export const createGetCustomersApiTool = (context: UserContext) => tool({
  description: 'Get customer contacts with optional filtering and search. Fast API-based retrieval for common customer queries.',
  inputSchema: z.object({
    search: z.string().optional().describe('Search term to filter customers by name, email, or company'),
    type: z.enum(['customer', 'vendor', 'both']).optional().describe('Filter by contact type'),
    isActive: z.boolean().optional().describe('Filter by active status'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of customers to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ search, type = 'customer', isActive, limit, offset }) => {
    try {
      const params: Record<string, any> = { limit, offset };
      if (search) params.search = search;
      if (type) params.type = type;
      if (isActive !== undefined) params.isActive = isActive;

      const data = await apiClient.get<{ contacts: Contact[]; total: number }>('/api/sales/contacts', params);
      
      return {
        success: true,
        data: data.contacts,
        total: data.total,
        message: `Found ${data.total} customers${search ? ` matching "${search}"` : ''}`,
      };
    } catch (error) {
      console.error('[getCustomers] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch customers',
      };
    }
  },
});

/**
 * Create a new customer contact
 */
export const createCreateCustomerApiTool = (context: UserContext) => tool({
  description: 'Create a new customer contact with validation. Fast API-based creation with proper business logic.',
  inputSchema: z.object({
    displayName: z.string().min(1).describe('Customer display name (required)'),
    firstName: z.string().optional().describe('First name for individual customers'),
    lastName: z.string().optional().describe('Last name for individual customers'),
    companyName: z.string().optional().describe('Company name for business customers'),
    email: z.string().email().optional().describe('Email address'),
    phone: z.string().optional().describe('Primary phone number'),
    mobile: z.string().optional().describe('Mobile phone number'),
    type: z.enum(['customer', 'vendor', 'both']).default('customer').describe('Contact type'),
    customerType: z.enum(['individual', 'business']).default('individual').describe('Customer classification'),
    creditLimit: z.string().default('0').describe('Credit limit amount'),
    paymentTerms: z.string().optional().describe('Payment terms (e.g., "Net 30")'),
    taxId: z.string().optional().describe('Tax ID number'),
    notes: z.string().optional().describe('Internal notes'),
    billingAddress: z.object({
      street1: z.string().default(''),
      street2: z.string().default(''),
      city: z.string().default(''),
      state: z.string().default(''),
      postalCode: z.string().default(''),
      country: z.string().default(''),
    }).optional().describe('Billing address information'),
  }),
  execute: async ({ displayName, firstName, lastName, companyName, email, phone, mobile, type, customerType, creditLimit, paymentTerms, taxId, notes, billingAddress }) => {
    try {
      const customerData = {
        displayName,
        firstName,
        lastName,
        companyName,
        email,
        phone,
        mobile,
        type,
        customerType,
        creditLimit,
        paymentTerms,
        taxId,
        notes,
        billingAddress: billingAddress || {
          street1: '',
          street2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      };

      const data = await apiClient.post<{ contact: Contact }>('/api/sales/contacts', customerData);
      
      return {
        success: true,
        data: data.contact,
        message: `Customer "${displayName}" created successfully`,
      };
    } catch (error) {
      console.error('[createCustomer] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to create customer',
      };
    }
  },
});

// Helper function to resolve customer by name
async function resolveCustomerByName(customerName: string): Promise<string | null> {
  try {
    const params = { search: customerName, type: 'customer', limit: 5 };
    const data = await apiClient.get<{ contacts: Contact[]; total: number }>('/api/sales/contacts', params);
    
    if (data.contacts && data.contacts.length > 0) {
      return data.contacts[0].id;
    }
    return null;
  } catch (error) {
    console.error('[resolveCustomerByName] Error:', error);
    return null;
  }
}

/**
 * Get sales orders with filtering and search
 */
export const createGetSalesOrdersApiTool = (context: UserContext) => tool({
  description: 'Get sales orders with optional filtering by customer, status, or date range. Fast API-based retrieval.',
  inputSchema: z.object({
    customerId: z.string().uuid().optional().describe('Filter by specific customer ID'),
    customerName: z.string().optional().describe('Filter by customer name (will resolve to customer ID)'),
    status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'completed']).optional().describe('Filter by order status'),
    dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD format)'),
    dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD format)'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of orders to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ customerId, customerName, status, dateFrom, dateTo, limit, offset }) => {
    try {
      // If customerName provided but not customerId, resolve customer first
      let resolvedCustomerId = customerId;
      if (customerName && !customerId) {
        const customerIdResult = await resolveCustomerByName(customerName);
        if (!customerIdResult) {
          return {
            success: false,
            error: `No customer found matching "${customerName}"`,
          };
        }
        resolvedCustomerId = customerIdResult;
      }

      const params: Record<string, any> = { limit, offset };
      if (resolvedCustomerId) params.customerId = resolvedCustomerId;
      if (status) params.status = status;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const data = await apiClient.get<{ orders: SalesOrder[]; total: number }>('/api/sales/orders', params);
      
      return {
        success: true,
        data: data.orders,
        total: data.total,
        message: `Found ${data.total} sales orders${customerName ? ` for customer "${customerName}"` : ''}${status ? ` with status "${status}"` : ''}`,
      };
    } catch (error) {
      console.error('[getSalesOrders] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch sales orders',
      };
    }
  },
});

/**
 * Get sales quotations with filtering
 */
export const createGetQuotationsApiTool = (context: UserContext) => tool({
  description: 'Get sales quotations with optional filtering by customer or status. Fast API-based retrieval.',
  inputSchema: z.object({
    customerId: z.string().uuid().optional().describe('Filter by specific customer ID'),
    customerName: z.string().optional().describe('Filter by customer name (will resolve to customer ID)'),
    status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).optional().describe('Filter by quotation status'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of quotations to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ customerId, customerName, status, limit, offset }) => {
    try {
      // If customerName provided but not customerId, resolve customer first
      let resolvedCustomerId = customerId;
      if (customerName && !customerId) {
        const customerIdResult = await resolveCustomerByName(customerName);
        if (!customerIdResult) {
          return {
            success: false,
            error: `No customer found matching "${customerName}"`,
          };
        }
        resolvedCustomerId = customerIdResult;
      }

      const params: Record<string, any> = { limit, offset };
      if (resolvedCustomerId) params.customerId = resolvedCustomerId;
      if (status) params.status = status;

      const data = await apiClient.get<{ quotations: Quotation[]; total: number }>('/api/sales/quotations', params);
      
      return {
        success: true,
        data: data.quotations,
        total: data.total,
        message: `Found ${data.total} quotations${customerName ? ` for customer "${customerName}"` : ''}${status ? ` with status "${status}"` : ''}`,
      };
    } catch (error) {
      console.error('[getQuotations] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch quotations',
      };
    }
  },
});

/**
 * Get products with filtering and search
 */
export const createGetProductsApiTool = (context: UserContext) => tool({
  description: 'Get products with optional filtering and search. Fast API-based retrieval for product queries.',
  inputSchema: z.object({
    search: z.string().optional().describe('Search term to filter products by name or SKU'),
    isActive: z.boolean().optional().describe('Filter by active status'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of products to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ search, isActive, limit, offset }) => {
    try {
      const params: Record<string, any> = { limit, offset };
      if (search) params.search = search;
      if (isActive !== undefined) params.isActive = isActive;

      const data = await apiClient.get<{ products: any[]; total: number }>('/api/sales/products', params);
      
      return {
        success: true,
        data: data.products,
        total: data.total,
        message: `Found ${data.total} products${search ? ` matching "${search}"` : ''}`,
      };
    } catch (error) {
      console.error('[getProducts] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch products',
      };
    }
  },
});

// Export all sales API tools as a collection
export function createSalesApiTools(context: UserContext) {
  return {
    getCustomers: createGetCustomersApiTool(context),
    createCustomer: createCreateCustomerApiTool(context),
    getSalesOrders: createGetSalesOrdersApiTool(context),
    getQuotations: createGetQuotationsApiTool(context),
    getProducts: createGetProductsApiTool(context),
  };
}
import { toast } from 'sonner';

export type ApiClientOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
};

export class ApiClient {
  static async request<T>(
    url: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, params, headers = {} } = options;

    // Add query params
    const urlWithParams = params
      ? `${url}?${new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        )}`
      : url;

    const response = await fetch(urlWithParams, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data.error || { message: 'Request failed' };
      throw new ApiError(error.message, error.code, response.status, error.details);
    }

    return data;
  }

  static get<T>(url: string, params?: Record<string, any>) {
    return this.request<T>(url, { params });
  }

  static post<T>(url: string, body?: any) {
    return this.request<T>(url, { method: 'POST', body });
  }

  static put<T>(url: string, body?: any) {
    return this.request<T>(url, { method: 'PUT', body });
  }

  static patch<T>(url: string, body?: any) {
    return this.request<T>(url, { method: 'PATCH', body });
  }

  static delete<T>(url: string) {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Toast helper for mutations
export function handleMutationError(error: unknown, defaultMessage = 'Something went wrong') {
  if (error instanceof ApiError) {
    toast.error(error.message || defaultMessage);
  } else if (error instanceof Error) {
    toast.error(error.message || defaultMessage);
  } else {
    toast.error(defaultMessage);
  }
}

export function handleMutationSuccess(message: string) {
  toast.success(message);
}

// Create a default instance for backwards compatibility
export const apiClient = {
  get: <T>(url: string, params?: Record<string, any>) => ApiClient.get<T>(url, params),
  post: <T>(url: string, body?: any) => ApiClient.post<T>(url, body),
  put: <T>(url: string, body?: any) => ApiClient.put<T>(url, body),
  delete: <T>(url: string) => ApiClient.delete<T>(url),
  patch: <T>(url: string, body?: any) => ApiClient.patch<T>(url, body),
};
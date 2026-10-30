import { APP_CONFIG } from '../config/app.config';

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  status: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = APP_CONFIG.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Attach admin or session token if present
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawUser = localStorage.getItem('courrier3_current_user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user?.role === 'super_admin' || user?.role === 'admin_operator') {
            headers['Authorization'] = 'Bearer maxline_admin_platform_token';
          }
        }
      } catch {}
    }

    // Default to platform admin token if in admin routes or unassigned
    if (!headers['Authorization'] && typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin')) {
      headers['Authorization'] = 'Bearer maxline_admin_platform_token';
    }

    return headers;
  }

  public async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(headers),
      });

      if (!response.ok) {
        let msg = response.statusText || 'An error occurred during request execution.';
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) msg = errBody.error.message;
        } catch {}
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: msg,
          },
          status: response.status,
        };
      }

      const json = await response.json();
      return { data: json.data !== undefined ? json.data : json, error: null, status: response.status };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network failure',
        },
        status: 0,
      };
    }
  }

  public async post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(headers),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let msg = response.statusText || 'Request failed';
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) msg = errBody.error.message;
        } catch {}
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: msg,
          },
          status: response.status,
        };
      }

      const json = await response.json();
      return { data: json.data !== undefined ? json.data : json, error: null, status: response.status };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network failure',
        },
        status: 0,
      };
    }
  }

  public async put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(headers),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let msg = response.statusText || 'Request failed';
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) msg = errBody.error.message;
        } catch {}
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: msg,
          },
          status: response.status,
        };
      }

      const json = await response.json();
      return { data: json.data !== undefined ? json.data : json, error: null, status: response.status };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network failure',
        },
        status: 0,
      };
    }
  }
}

export const apiClient = new ApiClient();

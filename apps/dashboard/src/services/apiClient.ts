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

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'An error occurred during request execution.',
          },
          status: response.status,
        };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
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

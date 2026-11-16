import { APIRequestContext, APIResponse, test } from '@playwright/test';
import { ENV } from '@utils/envConfig';
import { Logger } from '@utils/logger';

/**
 * Reusable Base REST API Client wrapping Playwright's native `APIRequestContext`.
 * Centralizes HTTP methods, base URL resolution, custom headers, and Allure step logging.
 */
export abstract class BaseApiClient {
  protected readonly request: APIRequestContext;
  protected readonly baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string = ENV.apiBaseUrl) {
    this.request = request;
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Builds the full endpoint URL from a relative path.
   */
  protected buildUrl(endpointPath: string): string {
    const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Wraps API calls in an Allure/Playwright step and logs HTTP status codes.
   */
  protected async executeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpointPath: string,
    action: (fullUrl: string) => Promise<APIResponse>
  ): Promise<APIResponse> {
    const fullUrl = this.buildUrl(endpointPath);
    const stepTitle = `API ${method} ${endpointPath}`;
    Logger.step(stepTitle);

    return await test.step(stepTitle, async () => {
      const response = await action(fullUrl);
      Logger.info(`⬅️  API Response [${method} ${endpointPath}] -> Status: ${response.status()}`);
      return response;
    });
  }

  protected async get(endpointPath: string, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.executeRequest('GET', endpointPath, (url) =>
      this.request.get(url, { headers })
    );
  }

  protected async post(
    endpointPath: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    return await this.executeRequest('POST', endpointPath, (url) =>
      this.request.post(url, { data: payload, headers })
    );
  }

  protected async put(
    endpointPath: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    return await this.executeRequest('PUT', endpointPath, (url) =>
      this.request.put(url, { data: payload, headers })
    );
  }

  protected async patch(
    endpointPath: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    return await this.executeRequest('PATCH', endpointPath, (url) =>
      this.request.patch(url, { data: payload, headers })
    );
  }

  protected async delete(endpointPath: string, headers?: Record<string, string>): Promise<APIResponse> {
    return await this.executeRequest('DELETE', endpointPath, (url) =>
      this.request.delete(url, { headers })
    );
  }
}

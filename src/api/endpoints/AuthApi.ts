import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { BaseApiClient } from '../BaseApiClient';
import { AuthTokenRequest, AuthTokenResponse } from '../schemas/booking.schema';
import { ENV } from '@utils/envConfig';

/**
 * Domain API Client for Authentication (`/auth`).
 * Generates auth tokens for protected PUT, PATCH, and DELETE operations.
 */
export class AuthApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Sends a POST request to `/auth` with username and password credentials.
   */
  public async createToken(credentials: AuthTokenRequest): Promise<APIResponse> {
    return await this.post('/auth', credentials, {
      'Content-Type': 'application/json',
    });
  }

  /**
   * Helper method that authenticates with valid admin credentials and returns the token string.
   */
  public async getValidAuthToken(): Promise<string> {
    const response = await this.createToken({
      username: ENV.credentials.apiAdminUser,
      password: ENV.credentials.apiAdminPassword,
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as AuthTokenResponse;
    expect(body.token).toBeTruthy();
    return body.token!;
  }
}

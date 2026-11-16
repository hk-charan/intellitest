import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '../BaseApiClient';
import { BookingPayload } from '../schemas/booking.schema';

/**
 * Domain API Client for Booking CRUD Operations (`/booking`).
 * Encapsulates Create, Read, Update (PUT/PATCH), and Delete endpoints with Cookie token headers.
 */
export class BookingApi extends BaseApiClient {
  private readonly defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Builds headers including the authentication token cookie (`Cookie: token=<token>`).
   */
  private getAuthorizedHeaders(token?: string): Record<string, string> {
    if (!token) {
      return { ...this.defaultHeaders };
    }
    return {
      ...this.defaultHeaders,
      Cookie: `token=${token}`,
    };
  }

  /**
   * GET `/booking` — Retrieves a list of booking IDs (optionally filtered by query params).
   */
  public async getAllBookingIds(queryParams?: Record<string, string>): Promise<APIResponse> {
    const queryString = queryParams
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';
    return await this.get(`/booking${queryString}`, this.defaultHeaders);
  }

  /**
   * GET `/booking/:id` — Retrieves details of a specific booking by ID.
   */
  public async getBookingById(bookingId: number): Promise<APIResponse> {
    return await this.get(`/booking/${bookingId}`, this.defaultHeaders);
  }

  /**
   * POST `/booking` — Creates a new booking record.
   */
  public async createBooking(payload: BookingPayload): Promise<APIResponse> {
    return await this.post('/booking', payload, this.defaultHeaders);
  }

  /**
   * PUT `/booking/:id` — Fully updates an existing booking (requires auth token).
   */
  public async updateBooking(
    bookingId: number,
    payload: BookingPayload,
    token?: string
  ): Promise<APIResponse> {
    return await this.put(`/booking/${bookingId}`, payload, this.getAuthorizedHeaders(token));
  }

  /**
   * PATCH `/booking/:id` — Partially updates fields of an existing booking (requires auth token).
   */
  public async partialUpdateBooking(
    bookingId: number,
    partialPayload: Partial<BookingPayload>,
    token?: string
  ): Promise<APIResponse> {
    return await this.patch(
      `/booking/${bookingId}`,
      partialPayload,
      this.getAuthorizedHeaders(token)
    );
  }

  /**
   * DELETE `/booking/:id` — Deletes an existing booking (requires auth token).
   */
  public async deleteBooking(bookingId: number, token?: string): Promise<APIResponse> {
    return await this.delete(`/booking/${bookingId}`, this.getAuthorizedHeaders(token));
  }
}

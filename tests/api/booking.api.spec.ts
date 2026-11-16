import { test, expect } from '@fixtures/customFixtures';
import { DataGenerator } from '@utils/dataGenerator';
import { ENV } from '@utils/envConfig';
import {
  AuthTokenResponseSchema,
  BookingIdListSchema,
  BookingPayload,
  BookingPayloadSchema,
  CreateBookingResponseSchema,
} from '../../src/api/schemas/booking.schema';

/**
 * End-to-End REST API Test Suite (`/auth` & `/booking`).
 * Validates Token Authentication, CRUD Lifecycle, Zod Runtime JSON Schema Contracts, and Negative Authorization.
 */
test.describe('REST API Automation Suite - Booking & Auth Microservice @api @regression', () => {
  test('TC-API-001: Verify valid admin credentials generate an auth token and invalid credentials fail @smoke', async ({
    authApi,
  }) => {
    // 1. Valid credentials -> returns token (validated via Zod schema)
    const validResponse = await authApi.createToken({
      username: ENV.credentials.apiAdminUser,
      password: ENV.credentials.apiAdminPassword,
    });
    expect(validResponse.status()).toBe(200);
    const validBody = AuthTokenResponseSchema.parse(await validResponse.json());
    expect(validBody.token).toBeDefined();

    // 2. Invalid credentials -> returns reason "Bad credentials"
    const invalidResponse = await authApi.createToken({
      username: 'wrong_admin',
      password: 'wrong_password',
    });
    expect(invalidResponse.status()).toBe(200);
    const invalidBody = AuthTokenResponseSchema.parse(await invalidResponse.json());
    expect(invalidBody.token).toBeUndefined();
    expect(invalidBody.reason).toBe('Bad credentials');
  });

  test('TC-API-002: Complete Booking CRUD Lifecycle with Zod Runtime Schema Validation (POST -> GET -> PUT -> PATCH -> DELETE) @smoke', async ({
    authApi,
    bookingApi,
  }) => {
    // Step 1: Create a new booking (POST /booking) & validate contract via Zod
    const initialPayload: BookingPayload = DataGenerator.generateBookingPayload({
      totalprice: 350,
      additionalneeds: 'Airport Pickup',
    });

    const createRes = await bookingApi.createBooking(initialPayload);
    expect(createRes.status()).toBe(200);
    const createdData = CreateBookingResponseSchema.parse(await createRes.json());
    expect(createdData.booking).toEqual(initialPayload);

    const bookingId = createdData.bookingid;

    // Step 2: Retrieve the created booking and verify runtime schema + data (GET /booking/:id)
    const getRes = await bookingApi.getBookingById(bookingId);
    expect(getRes.status()).toBe(200);
    const fetchedBooking = BookingPayloadSchema.parse(await getRes.json());
    expect(fetchedBooking).toEqual(initialPayload);

    // Step 3: Generate Auth Token for protected update/delete operations
    const token = await authApi.getValidAuthToken();

    // Step 4: Full Update of the booking (PUT /booking/:id)
    const updatedPayload: BookingPayload = DataGenerator.generateBookingPayload({
      firstname: initialPayload.firstname,
      lastname: 'UpdatedLastName',
      totalprice: 500,
      depositpaid: false,
      additionalneeds: 'Late Checkout',
    });

    const putRes = await bookingApi.updateBooking(bookingId, updatedPayload, token);
    expect(putRes.status()).toBe(200);
    const updatedBody = BookingPayloadSchema.parse(await putRes.json());
    expect(updatedBody.lastname).toBe('UpdatedLastName');
    expect(updatedBody.totalprice).toBe(500);
    expect(updatedBody.depositpaid).toBe(false);

    // Step 5: Partial Update of the booking (PATCH /booking/:id)
    const patchRes = await bookingApi.partialUpdateBooking(
      bookingId,
      { totalprice: 775, additionalneeds: 'VIP Lounge Access' },
      token
    );
    expect(patchRes.status()).toBe(200);
    const patchedBody = BookingPayloadSchema.parse(await patchRes.json());
    expect(patchedBody.totalprice).toBe(775);
    expect(patchedBody.additionalneeds).toBe('VIP Lounge Access');
    expect(patchedBody.firstname).toBe(initialPayload.firstname);

    // Step 6: Delete the booking (DELETE /booking/:id)
    const deleteRes = await bookingApi.deleteBooking(bookingId, token);
    expect(deleteRes.status()).toBe(201);

    // Step 7: Verify deleted booking returns 404 Not Found
    const getAfterDeleteRes = await bookingApi.getBookingById(bookingId);
    expect(getAfterDeleteRes.status()).toBe(404);
  });

  test('TC-API-003: Negative Authorization - Updating or Deleting a booking without token returns 403 Forbidden', async ({
    bookingApi,
  }) => {
    const payload = DataGenerator.generateBookingPayload();
    const createRes = await bookingApi.createBooking(payload);
    expect(createRes.status()).toBe(200);
    const { bookingid } = CreateBookingResponseSchema.parse(await createRes.json());

    // Attempt PUT without auth token -> Expect 403 Forbidden
    const unauthorizedPutRes = await bookingApi.updateBooking(bookingid, payload);
    expect(unauthorizedPutRes.status()).toBe(403);

    // Attempt DELETE with fake/invalid token -> Expect 403 Forbidden
    const unauthorizedDeleteRes = await bookingApi.deleteBooking(bookingid, 'invalid_token_xyz');
    expect(unauthorizedDeleteRes.status()).toBe(403);
  });

  test('TC-API-004: Verify GET /booking query filter returns schema-valid matching booking IDs', async ({
    bookingApi,
  }) => {
    const uniquePayload = DataGenerator.generateBookingPayload();
    const createRes = await bookingApi.createBooking(uniquePayload);
    expect(createRes.status()).toBe(200);
    const { bookingid } = CreateBookingResponseSchema.parse(await createRes.json());

    const filterRes = await bookingApi.getAllBookingIds({
      firstname: uniquePayload.firstname,
      lastname: uniquePayload.lastname,
    });
    expect(filterRes.status()).toBe(200);

    const list = BookingIdListSchema.parse(await filterRes.json());
    expect(list.some((item) => item.bookingid === bookingid)).toBe(true);
  });
});

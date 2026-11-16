import { z } from 'zod';

/**
 * Zod Runtime Schemas & Inferred TypeScript Types for Restful-Booker REST API.
 * Validates both compile-time TypeScript contracts AND runtime JSON response structures.
 */

export const AuthTokenRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const AuthTokenResponseSchema = z.object({
  token: z.string().min(5).optional(),
  reason: z.string().optional(),
});

export const BookingDatesSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export const BookingPayloadSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int().nonnegative(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
  additionalneeds: z.string().optional(),
});

export const CreateBookingResponseSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingPayloadSchema,
});

export const BookingIdSummarySchema = z.object({
  bookingid: z.number().int().positive(),
});

export const BookingIdListSchema = z.array(BookingIdSummarySchema);

// Inferred TypeScript types (Single Source of Truth for both TS compiler & Zod runtime)
export type AuthTokenRequest = z.infer<typeof AuthTokenRequestSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export type BookingDates = z.infer<typeof BookingDatesSchema>;
export type BookingPayload = z.infer<typeof BookingPayloadSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type BookingIdSummary = z.infer<typeof BookingIdSummarySchema>;

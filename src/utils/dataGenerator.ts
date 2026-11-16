import { CustomerCheckoutInfo } from '../types/testData.types';

/**
 * Dynamic Test Data Generator Utility.
 * Ensures parallel workers generate unique, non-colliding records during UI & REST API execution.
 */
export class DataGenerator {
  private static readonly FIRST_NAMES = ['Charan', 'Rohan', 'Priya', 'Ananya', 'Vikram', 'Neha', 'Karthik'];
  private static readonly LAST_NAMES = ['Gowda', 'Sharma', 'Patel', 'Reddy', 'Nair', 'Verma', 'Iyer'];
  private static readonly ROOM_NEEDS = ['Breakfast', 'Late Check-out', 'Airport Shuttle', 'Extra Pillow'];

  /**
   * Generates a unique alphanumeric suffix using timestamp + random string.
   */
  public static uniqueSuffix(): string {
    const timePart = Date.now().toString(36).slice(-4);
    const randomPart = Math.random().toString(36).substring(2, 6);
    return `${timePart}${randomPart}`.toUpperCase();
  }

  /**
   * Picks a random element from a typed array.
   */
  public static randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Generates a random integer between min and max (inclusive).
   */
  public static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Formats a Date offset by `daysFromToday` as YYYY-MM-DD (used in Booking API payloads).
   */
  public static futureDateFormatted(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generates dynamic customer checkout details for E-Commerce UI tests.
   */
  public static generateCheckoutCustomer(): CustomerCheckoutInfo {
    const suffix = this.uniqueSuffix();
    return {
      firstName: `${this.randomItem(this.FIRST_NAMES)}_${suffix}`,
      lastName: this.randomItem(this.LAST_NAMES),
      postalCode: String(this.randomInt(100000, 999999)),
    };
  }

  /**
   * Generates a dynamic, parallel-safe booking payload for Restful-Booker API tests.
   */
  public static generateBookingPayload(overrides?: Partial<{
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    checkin: string;
    checkout: string;
    additionalneeds: string;
  }>) {
    const suffix = this.uniqueSuffix();
    return {
      firstname: overrides?.firstname ?? `${this.randomItem(this.FIRST_NAMES)}_${suffix}`,
      lastname: overrides?.lastname ?? this.randomItem(this.LAST_NAMES),
      totalprice: overrides?.totalprice ?? this.randomInt(120, 850),
      depositpaid: overrides?.depositpaid ?? true,
      bookingdates: {
        checkin: overrides?.checkin ?? this.futureDateFormatted(2),
        checkout: overrides?.checkout ?? this.futureDateFormatted(7),
      },
      additionalneeds: overrides?.additionalneeds ?? this.randomItem(this.ROOM_NEEDS),
    };
  }
}

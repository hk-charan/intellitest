/**
 * TypeScript Interfaces for IntelliTest JSON Test Data & Domain Models.
 * Provides compile-time validation and IDE autocomplete for data-driven tests.
 */

export interface UserCredential {
  id: string;
  role: 'standard' | 'locked' | 'problem' | 'invalid';
  username: string;
  password: string;
  expectedOutcome: 'success' | 'error';
  expectedErrorMessage?: string;
  description: string;
}

export interface UsersTestData {
  validUsers: UserCredential[];
  invalidAndLockedUsers: UserCredential[];
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  testIdSlug: string;
}

export interface CustomerCheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export interface ProductsTestData {
  catalog: ProductItem[];
  checkoutCustomers: CustomerCheckoutInfo[];
}

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file at project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Strongly-typed configuration interface for IntelliTest.
 * Ensures every test and page object accesses validated settings with sensible defaults.
 */
export interface EnvironmentConfig {
  testEnv: string;
  uiBaseUrl: string;
  apiBaseUrl: string;
  credentials: {
    standardUser: string;
    lockedOutUser: string;
    problemUser: string;
    password: string;
    apiAdminUser: string;
    apiAdminPassword: string;
  };
  execution: {
    headless: boolean;
    slowMo: number;
    workers: number;
    retries: number;
    isCI: boolean;
  };
  ai: {
    enabled: boolean;
    geminiApiKey: string;
    geminiModel: string;
  };
}

/**
 * Centralized Environment Configuration singleton.
 * Reads process.env values with safe fallbacks so tests run out-of-the-box in local & CI environments.
 */
export const ENV: EnvironmentConfig = {
  testEnv: process.env.TEST_ENV || 'qa',
  uiBaseUrl: process.env.UI_BASE_URL || 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',

  credentials: {
    standardUser: process.env.STANDARD_USER || 'standard_user',
    lockedOutUser: process.env.LOCKED_OUT_USER || 'locked_out_user',
    problemUser: process.env.PROBLEM_USER || 'problem_user',
    password: process.env.USER_PASSWORD || 'secret_sauce',
    apiAdminUser: process.env.API_ADMIN_USER || 'admin',
    apiAdminPassword: process.env.API_ADMIN_PASSWORD || 'password123',
  },

  execution: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO || 0),
    workers: Number(process.env.WORKERS || 4),
    retries: process.env.CI ? 2 : Number(process.env.RETRIES || 0),
    isCI: Boolean(process.env.CI),
  },

  ai: {
    enabled: process.env.ENABLE_AI_ANALYSIS === 'true',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  },
};

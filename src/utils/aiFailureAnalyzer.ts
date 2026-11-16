import { TestInfo } from '@playwright/test';
import { ENV } from './envConfig';
import { Logger } from './logger';

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thought?: boolean;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

export interface FailureContext {
  testTitle: string;
  projectName: string;
  filePath: string;
  durationMs: number;
  errorMessage: string;
  errorStack: string;
  pageUrl?: string;
}

/**
 * AI-Assisted Test Failure Analyzer for IntelliTest.
 *
 * Architecture:
 * 1. Triggered ONLY when a test fails (`testInfo.status !== testInfo.expectedStatus`) inside `customFixtures.ts`.
 * 2. When `ENABLE_AI_ANALYSIS=true` and `GEMINI_API_KEY` is provided, sends failure context to Google Gemini (`gemini-2.5-flash`).
 * 3. Includes a deterministic Rule-Based Heuristic Analyzer as a zero-cost/offline fallback so every failed test
 *    still receives an actionable Root Cause Analysis attachment in Allure and Playwright reports.
 */
export class AiFailureAnalyzer {
  /**
   * Strips ANSI color escape codes from Playwright error messages for clean markdown output.
   */
  private static stripAnsiCodes(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  }

  /**
   * Deterministic Heuristic Root-Cause Classifier (Offline / Fallback Engine).
   * Classifies common Playwright UI & API failure signatures when Gemini API is disabled or unreachable.
   */
  private static generateHeuristicDiagnosis(ctx: FailureContext): string {
    const err = ctx.errorMessage.toLowerCase();
    let category = 'Unclassified Test Failure';
    let rootCause = 'The test failed due to an unexpected assertion or runtime error.';
    let suggestedFix = 'Inspect the attached Playwright Trace (`trace.zip`) and screenshot at the failing step.';

    if (err.includes('timeout') && err.includes('locator')) {
      category = 'UI Locator Timeout / Element Not Found';
      rootCause =
        'Playwright waited for the target locator to become visible/enabled, but the element did not appear within the configured timeout.';
      suggestedFix =
        '1. Check if the application navigated to the expected URL.\n2. Verify the `[data-test]` or `getByRole` selector in the Page Object.\n3. Check the attached screenshot to see if an error banner or modal blocked the element.';
    } else if (err.includes('tohaveurl') || err.includes('tohavetext') || err.includes('tocontaintext')) {
      category = 'UI Web-First Assertion Mismatch';
      rootCause =
        'The element or URL was found, but its actual text/value did not match the expected value within the assertion timeout.';
      suggestedFix =
        'Compare the `Expected` vs `Received` values in the error log below and verify test data in `src/data/*.json`.';
    } else if (err.includes('status') || err.includes('403') || err.includes('401') || err.includes('404') || err.includes('500')) {
      category = 'REST API Contract / HTTP Status Failure';
      rootCause =
        'An API endpoint returned an unexpected HTTP status code (e.g., 401/403 Auth failure, 404 Not Found, or 5xx Server Error).';
      suggestedFix =
        'Check if the auth token (`Cookie: token=...`) expired or if the request payload violated the endpoint schema.';
    } else if (err.includes('strict mode violation')) {
      category = 'Playwright Strict Mode Violation (Ambiguous Locator)';
      rootCause = 'The locator resolved to multiple DOM elements instead of a single unique element.';
      suggestedFix =
        'Refine the locator in the Page Object using `.filter({ hasText: ... })`, `.first()`, or a unique `data-test` attribute.';
    }

    return [
      `# 🤖 IntelliTest Failure Diagnostic Report`,
      `**Analysis Engine:** Built-in Heuristic Classifier *(Set \`ENABLE_AI_ANALYSIS=true\` + \`GEMINI_API_KEY\` for live Gemini LLM analysis)*`,
      `**Test Name:** \`${ctx.testTitle}\``,
      `**Project:** \`${ctx.projectName}\``,
      `**Page URL at Failure:** \`${ctx.pageUrl || 'N/A (API or Pre-Navigation)'}\``,
      `**Duration:** \`${ctx.durationMs}ms\``,
      ``,
      `### 1. Failure Category`,
      `**${category}**`,
      ``,
      `### 2. Probable Root Cause`,
      `${rootCause}`,
      ``,
      `### 3. Recommended Engineering Action`,
      `${suggestedFix}`,
      ``,
      `### 4. Cleaned Error Summary`,
      `\`\`\``,
      `${ctx.errorMessage}`,
      `\`\`\``,
    ].join('\n');
  }

  /**
   * Calls Google Gemini API (`gemini-2.5-flash`) to generate an AI-assisted root cause analysis.
   * Falls back safely to `generateHeuristicDiagnosis` if disabled, missing key, or network error.
   */
  public static async analyzeFailure(testInfo: TestInfo, pageUrl?: string): Promise<void> {
    const rawError = testInfo.error?.message || 'Unknown test failure';
    const rawStack = testInfo.error?.stack || '';

    const context: FailureContext = {
      testTitle: testInfo.title,
      projectName: testInfo.project.name,
      filePath: testInfo.file,
      durationMs: testInfo.duration,
      errorMessage: this.stripAnsiCodes(rawError),
      errorStack: this.stripAnsiCodes(rawStack),
      pageUrl,
    };

    let diagnosticReport: string;

    if (ENV.ai.enabled && ENV.ai.geminiApiKey && ENV.ai.geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        Logger.info(`🤖 Calling Google Gemini (${ENV.ai.geminiModel}) for AI failure analysis...`);

        const prompt = [
          `You are a Senior SDET Architect analyzing a failed Playwright TypeScript automated test.`,
          `Provide a concise, actionable markdown report with:`,
          `1. Failure Category (UI Locator / Application Bug / API Failure / Test Data Issue)`,
          `2. Probable Root Cause (2-3 sentences max)`,
          `3. Suggested Fix for the QA Engineer`,
          ``,
          `Test Title: ${context.testTitle}`,
          `Project: ${context.projectName}`,
          `Page URL: ${context.pageUrl || 'N/A'}`,
          `Error Message:\n${context.errorMessage}`,
          `Stack Trace:\n${context.errorStack.slice(0, 1200)}`,
        ].join('\n');

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${ENV.ai.geminiModel}:generateContent?key=${encodeURIComponent(ENV.ai.geminiApiKey)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const httpRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = (await httpRes.json()) as GeminiApiResponse;
        if (!httpRes.ok) {
          throw new Error(data.error?.message || `HTTP ${httpRes.status}`);
        }

        const parts = data.candidates?.[0]?.content?.parts || [];
        const answerText =
          parts
            .filter((p) => !p.thought && p.text)
            .map((p) => p.text)
            .join('\n') ||
          parts.map((p) => p.text).join('\n') ||
          'No response text returned from Gemini.';

        diagnosticReport = [
          `# 🤖 IntelliTest AI Failure Analysis (Powered by Google Gemini \`${ENV.ai.geminiModel}\`)`,
          `**Test Name:** \`${context.testTitle}\` | **Project:** \`${context.projectName}\``,
          `**Page URL:** \`${context.pageUrl || 'N/A'}\``,
          ``,
          answerText,
        ].join('\n');

        Logger.info('✅ Gemini AI Failure Analysis generated and attached to report.');
      } catch (error) {
        Logger.warn(
          `Gemini API call failed or timed out (${error instanceof Error ? error.message : 'Unknown error'}). Falling back to Heuristic Analyzer.`
        );
        diagnosticReport = this.generateHeuristicDiagnosis(context);
      }
    } else {
      Logger.info(
        'ℹ️ Generating Heuristic Failure Diagnostic Report (Set ENABLE_AI_ANALYSIS=true with GEMINI_API_KEY for live Gemini LLM).'
      );
      diagnosticReport = this.generateHeuristicDiagnosis(context);
    }

    // Attach the Markdown Diagnostic Report to both Playwright HTML Report & Allure Report
    await testInfo.attach('AI_Failure_Analysis.md', {
      body: Buffer.from(diagnosticReport, 'utf-8'),
      contentType: 'text/markdown',
    });
  }
}

/**
 * Centralized Structured Logger for IntelliTest.
 * Formats logs with ISO timestamps and severity levels for easy debugging in local console & CI logs.
 */
export class Logger {
  private static formatMessage(level: 'INFO' | 'STEP' | 'WARN' | 'ERROR', message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.padEnd(5)}] ${message}`;
  }

  /**
   * Log general informational messages.
   */
  public static info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  /**
   * Log high-level business or test steps (UI action, API call, assertion).
   */
  public static step(message: string): void {
    console.log(this.formatMessage('STEP', `➡️  ${message}`));
  }

  /**
   * Log non-fatal warnings (e.g., optional AI key not set, fallback used).
   */
  public static warn(message: string): void {
    console.warn(this.formatMessage('WARN', `⚠️  ${message}`));
  }

  /**
   * Log errors or test failure details.
   */
  public static error(message: string, errorObj?: unknown): void {
    const details = errorObj instanceof Error ? ` | ${errorObj.message}` : '';
    console.error(this.formatMessage('ERROR', `❌ ${message}${details}`));
  }
}

# ============================================================================
# INTELLITEST DOCKERFILE
# Uses Microsoft's official Playwright image with pre-installed browsers & OS deps
# ============================================================================
FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install exact dependencies
RUN npm ci

# Copy framework source code, tests, and configs
COPY tsconfig.json playwright.config.ts .env.example ./
COPY src ./src
COPY tests ./tests

# Ensure .auth directory exists inside container
RUN mkdir -p .auth allure-results playwright-report

# Default command runs UI, REST API, and Hybrid suites in parallel
CMD ["npx", "playwright", "test", "--project=chromium-ui", "--project=api-tests", "--project=hybrid-tests"]

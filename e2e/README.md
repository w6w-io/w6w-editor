# W6W E2E Tests

End-to-end tests for the W6W workflow platform using [Playwright](https://playwright.dev/).

## Structure

```
e2e/
├── api/                 # API tests (no browser required)
│   ├── workflows.test.ts
│   └── executions.test.ts
├── ui/                  # UI tests (browser automation)
│   └── example.test.ts
├── fixtures/            # Test data and fixtures
│   ├── workflows.ts
│   └── index.ts
├── utils/               # Test utilities
│   ├── api-client.ts
│   └── index.ts
├── playwright.config.ts # Playwright configuration
└── package.json
```

## Running Tests

### Install Dependencies

```bash
# From the editor root
pnpm install

# Install Playwright browsers (first time only)
pnpm --filter @w6w/e2e exec playwright install
```

### Run All Tests

```bash
# From editor root
pnpm test:e2e

# Or from e2e directory
pnpm test
```

### Run API Tests Only

```bash
pnpm test:e2e:api
```

### Run UI Tests Only

```bash
pnpm test:e2e:ui
```

### Run Tests in Headed Mode (see browser)

```bash
pnpm --filter @w6w/e2e test:headed
```

### Run Tests in Debug Mode

```bash
pnpm --filter @w6w/e2e test:debug
```

### View Test Report

```bash
pnpm --filter @w6w/e2e report
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3000` | Base URL for API tests |
| `WEB_BASE_URL` | `http://localhost:5173` | Base URL for UI tests |
| `CI` | - | Set automatically in CI environments |

### Test Projects

The Playwright configuration defines multiple projects:

- **api** - API tests (no browser)
- **chromium** - UI tests in Chrome
- **firefox** - UI tests in Firefox
- **webkit** - UI tests in Safari
- **mobile-chrome** - UI tests in mobile Chrome
- **mobile-safari** - UI tests in mobile Safari

Run specific project:

```bash
pnpm --filter @w6w/e2e test -- --project=api
pnpm --filter @w6w/e2e test -- --project=chromium
```

## Writing Tests

### API Tests

API tests use Playwright's `request` fixture for HTTP calls:

```typescript
import { test, expect } from "@playwright/test";
import { createApiClient } from "../utils/api-client";

test("should create workflow", async ({ request }) => {
  const api = createApiClient(request);

  const response = await api.createWorkflow({
    name: "Test Workflow",
    nodes: [],
    edges: [],
  });

  expect(response.status()).toBe(201);
});
```

### UI Tests

UI tests use Playwright's `page` fixture for browser automation:

```typescript
import { test, expect } from "@playwright/test";

test("should display editor", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-testid="workflow-canvas"]')).toBeVisible();
});
```

### Using Fixtures

Import test workflows from fixtures:

```typescript
import { simpleLinearWorkflow, cloneWorkflow } from "../fixtures/workflows";

test("should run workflow", async ({ request }) => {
  const api = createApiClient(request);
  const workflow = cloneWorkflow(simpleLinearWorkflow);

  // Use workflow...
});
```

## CI Integration

Tests run automatically in CI. The configuration:

- Retries failed tests 2 times
- Runs tests sequentially (1 worker)
- Generates GitHub Actions reporter
- Uploads test artifacts on failure

## Best Practices

1. **Use data-testid attributes** for UI element selection
2. **Clean up test data** after tests when possible
3. **Use fixtures** for consistent test data
4. **Keep tests independent** - don't rely on test order
5. **Use descriptive test names** that explain what's being tested
6. **Group related tests** in describe blocks

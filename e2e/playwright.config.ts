import { defineConfig, devices } from "@playwright/test";

/**
 * E2E Test Configuration
 *
 * This configuration supports both API and UI testing:
 * - API tests: Run against the backend services (no browser needed)
 * - UI tests: Run against the web application with browser automation
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Load environment variables
// Default to deno-api container when running in devcontainer, fallback to localhost
const API_BASE_URL = process.env.API_BASE_URL || "http://deno-api:8000";
const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:5173";

export default defineConfig({
	testDir: "./",
	testMatch: ["**/*.test.ts", "**/*.spec.ts"],

	// Run tests in parallel by default
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI
	workers: process.env.CI ? 1 : undefined,

	// Reporter configuration
	reporter: [
		["html", { outputFolder: "playwright-report" }],
		["list"],
		...(process.env.CI ? [["github"] as const] : []),
	],

	// Shared settings for all projects
	use: {
		// Base URL for API tests
		baseURL: API_BASE_URL,

		// Collect trace when retrying failed tests
		trace: "on-first-retry",

		// Screenshot on failure
		screenshot: "only-on-failure",
	},

	// Configure projects for different test types
	projects: [
		// API Tests - No browser needed
		{
			name: "api",
			testDir: "./api",
			testMatch: "**/*.test.ts",
			use: {
				baseURL: API_BASE_URL,
				extraHTTPHeaders: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			},
		},

		// UI Tests - Chromium (Desktop Chrome)
		{
			name: "chromium",
			testDir: "./ui",
			testMatch: "**/*.test.ts",
			use: {
				...devices["Desktop Chrome"],
				baseURL: WEB_BASE_URL,
			},
		},

		// UI Tests - Firefox
		{
			name: "firefox",
			testDir: "./ui",
			testMatch: "**/*.test.ts",
			use: {
				...devices["Desktop Firefox"],
				baseURL: WEB_BASE_URL,
			},
		},

		// UI Tests - WebKit (Safari)
		{
			name: "webkit",
			testDir: "./ui",
			testMatch: "**/*.test.ts",
			use: {
				...devices["Desktop Safari"],
				baseURL: WEB_BASE_URL,
			},
		},

		// UI Tests - Mobile Chrome
		{
			name: "mobile-chrome",
			testDir: "./ui",
			testMatch: "**/*.test.ts",
			use: {
				...devices["Pixel 5"],
				baseURL: WEB_BASE_URL,
			},
		},

		// UI Tests - Mobile Safari
		{
			name: "mobile-safari",
			testDir: "./ui",
			testMatch: "**/*.test.ts",
			use: {
				...devices["iPhone 12"],
				baseURL: WEB_BASE_URL,
			},
		},
	],

	// Configure output directories
	outputDir: "test-results",

	// Global timeout for each test
	timeout: 30000,

	// Expect timeout for assertions
	expect: {
		timeout: 5000,
	},

	// Web server configuration (optional - for running dev server during tests)
	// webServer: [
	//   {
	//     command: 'pnpm --filter @w6w/api dev',
	//     url: API_BASE_URL,
	//     reuseExistingServer: !process.env.CI,
	//     timeout: 120000,
	//   },
	//   {
	//     command: 'pnpm --filter @w6w/web dev',
	//     url: WEB_BASE_URL,
	//     reuseExistingServer: !process.env.CI,
	//     timeout: 120000,
	//   },
	// ],
});

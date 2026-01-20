/**
 * Server Availability Check
 *
 * Utilities for checking if the API server is available before running tests.
 */

/**
 * Check if the API server is reachable
 */
export async function isServerAvailable(baseUrl: string): Promise<boolean> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2000);

		const response = await fetch(`${baseUrl}/api/workflows`, {
			method: "GET",
			signal: controller.signal,
		});

		clearTimeout(timeout);
		return response.ok || response.status === 401; // 401 is ok, means server is up
	} catch {
		return false;
	}
}

/**
 * Get the API base URL from environment or default
 */
export function getApiBaseUrl(): string {
	return process.env.API_BASE_URL || "http://localhost:3000";
}

/**
 * Skip message for when server is not available
 */
export const SERVER_UNAVAILABLE_MESSAGE =
	"API server not available. Start the server or set API_BASE_URL environment variable.";

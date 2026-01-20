import { APIRequestContext, expect } from "@playwright/test";

/**
 * API Response wrapper with common assertions
 */
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/**
 * Pagination response structure
 */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * API Client for E2E testing
 *
 * Provides typed methods for interacting with the W6W API.
 */
export class ApiClient {
	constructor(private request: APIRequestContext) {}

	// ============================================
	// Workflow Endpoints
	// ============================================

	/**
	 * List all workflows
	 */
	async listWorkflows(params?: { limit?: number; offset?: number }) {
		const searchParams = new URLSearchParams();
		if (params?.limit) searchParams.set("limit", String(params.limit));
		if (params?.offset) searchParams.set("offset", String(params.offset));

		const url = `/api/workflows${searchParams.toString() ? `?${searchParams}` : ""}`;
		const response = await this.request.get(url);
		return response;
	}

	/**
	 * Get a workflow by ID
	 */
	async getWorkflow(workflowId: string) {
		const response = await this.request.get(`/api/workflows/${workflowId}`);
		return response;
	}

	/**
	 * Create a new workflow
	 */
	async createWorkflow(workflow: {
		name: string;
		nodes?: unknown[];
		edges?: unknown[];
	}) {
		const response = await this.request.post("/api/workflows", {
			data: { workflow },
		});
		return response;
	}

	/**
	 * Update a workflow
	 */
	async updateWorkflow(
		workflowId: string,
		workflow: { name?: string; nodes?: unknown[]; edges?: unknown[] },
	) {
		const response = await this.request.put(`/api/workflows/${workflowId}`, {
			data: { workflow },
		});
		return response;
	}

	/**
	 * Delete a workflow
	 */
	async deleteWorkflow(workflowId: string) {
		const response = await this.request.delete(`/api/workflows/${workflowId}`);
		return response;
	}

	/**
	 * Trigger workflow execution
	 */
	async runWorkflow(
		workflowId: string,
		options?: {
			vars?: Record<string, unknown>;
			async?: boolean;
		},
	) {
		const response = await this.request.post(
			`/api/workflows/${workflowId}/run`,
			{
				data: options || {},
			},
		);
		return response;
	}

	// ============================================
	// Execution Endpoints
	// ============================================

	/**
	 * List executions
	 */
	async listExecutions(params?: {
		limit?: number;
		offset?: number;
		workflowId?: string;
		status?: string;
	}) {
		const searchParams = new URLSearchParams();
		if (params?.limit) searchParams.set("limit", String(params.limit));
		if (params?.offset) searchParams.set("offset", String(params.offset));
		if (params?.workflowId) searchParams.set("workflowId", params.workflowId);
		if (params?.status) searchParams.set("status", params.status);

		const url = `/api/executions${searchParams.toString() ? `?${searchParams}` : ""}`;
		const response = await this.request.get(url);
		return response;
	}

	/**
	 * Get execution by ID
	 */
	async getExecution(executionId: string, options?: { includeNodes?: boolean }) {
		const searchParams = new URLSearchParams();
		if (options?.includeNodes)
			searchParams.set("includeNodes", String(options.includeNodes));

		const url = `/api/executions/${executionId}${searchParams.toString() ? `?${searchParams}` : ""}`;
		const response = await this.request.get(url);
		return response;
	}

	/**
	 * Get execution progress
	 */
	async getExecutionProgress(executionId: string) {
		const response = await this.request.get(
			`/api/executions/${executionId}/progress`,
		);
		return response;
	}

	/**
	 * Get execution node details
	 */
	async getExecutionNodes(executionId: string, nodeId?: string) {
		const searchParams = new URLSearchParams();
		if (nodeId) searchParams.set("nodeId", nodeId);

		const url = `/api/executions/${executionId}/nodes${searchParams.toString() ? `?${searchParams}` : ""}`;
		const response = await this.request.get(url);
		return response;
	}

	/**
	 * Cancel a running execution
	 */
	async cancelExecution(executionId: string) {
		const response = await this.request.post(
			`/api/executions/${executionId}/cancel`,
		);
		return response;
	}

	/**
	 * Retry a failed execution
	 */
	async retryExecution(executionId: string) {
		const response = await this.request.post(
			`/api/executions/${executionId}/retry`,
		);
		return response;
	}

	/**
	 * Get state transitions for an execution
	 */
	async getExecutionTransitions(executionId: string, nodeId?: string) {
		const searchParams = new URLSearchParams();
		if (nodeId) searchParams.set("nodeId", nodeId);

		const url = `/api/executions/${executionId}/transitions${searchParams.toString() ? `?${searchParams}` : ""}`;
		const response = await this.request.get(url);
		return response;
	}

	// ============================================
	// Helper Methods
	// ============================================

	/**
	 * Assert successful API response
	 */
	async assertSuccess<T>(response: Awaited<ReturnType<typeof this.request.get>>): Promise<ApiResponse<T>> {
		expect(response.ok()).toBeTruthy();
		const body = await response.json();
		expect(body.success).toBe(true);
		return body as ApiResponse<T>;
	}

	/**
	 * Assert error API response
	 */
	async assertError(
		response: Awaited<ReturnType<typeof this.request.get>>,
		expectedCode?: string,
		expectedStatus?: number,
	): Promise<ApiResponse> {
		if (expectedStatus) {
			expect(response.status()).toBe(expectedStatus);
		}
		const body = await response.json();
		expect(body.success).toBe(false);
		expect(body.error).toBeDefined();
		if (expectedCode) {
			expect(body.error.code).toBe(expectedCode);
		}
		return body as ApiResponse;
	}

	/**
	 * Wait for execution to complete
	 */
	async waitForExecution(
		executionId: string,
		options?: {
			timeout?: number;
			pollInterval?: number;
			expectedStatus?: string[];
		},
	): Promise<ApiResponse> {
		const timeout = options?.timeout || 30000;
		const pollInterval = options?.pollInterval || 500;
		const expectedStatus = options?.expectedStatus || [
			"completed",
			"failed",
			"cancelled",
		];

		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			const response = await this.getExecution(executionId);
			const body = (await response.json()) as ApiResponse<{ status: string }>;

			if (body.success && body.data && expectedStatus.includes(body.data.status)) {
				return body;
			}

			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		throw new Error(
			`Execution ${executionId} did not complete within ${timeout}ms`,
		);
	}
}

/**
 * Create an API client from a Playwright request context
 */
export function createApiClient(request: APIRequestContext): ApiClient {
	return new ApiClient(request);
}

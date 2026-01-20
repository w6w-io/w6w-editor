/**
 * Mock Server for E2E Tests
 *
 * Provides mock API responses when the real server isn't available.
 * Uses Playwright's route interception to mock HTTP responses.
 */

import type { Page, APIRequestContext, Route } from "@playwright/test";

/**
 * Mock data storage
 */
interface MockStore {
	workflows: Map<string, MockWorkflow>;
	executions: Map<string, MockExecution>;
	nodeExecutions: Map<string, MockNodeExecution[]>;
}

interface MockWorkflow {
	id: string;
	name: string;
	status: string;
	nodes: unknown[];
	edges: unknown[];
	createdAt: number;
}

interface MockExecution {
	executionId: string;
	workflowId: string;
	status: string;
	startedAt: number;
	completedAt?: number;
	duration?: number;
}

interface MockNodeExecution {
	nodeId: string;
	executionId: string;
	status: string;
	startedAt?: number;
	completedAt?: number;
	duration?: number;
	output?: unknown;
}

/**
 * Create a fresh mock store
 */
export function createMockStore(): MockStore {
	return {
		workflows: new Map(),
		executions: new Map(),
		nodeExecutions: new Map(),
	};
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create mock API route handlers
 */
export function createMockHandlers(store: MockStore) {
	return async (route: Route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname;
		const method = request.method();

		// Helper to return JSON response
		const json = (data: unknown, status = 200) => {
			return route.fulfill({
				status,
				contentType: "application/json",
				body: JSON.stringify(data),
			});
		};

		// GET /api/workflows
		if (path === "/api/workflows" && method === "GET") {
			const items = Array.from(store.workflows.values());
			return json({
				success: true,
				data: { items, total: items.length, limit: 50, offset: 0 },
			});
		}

		// POST /api/workflows
		if (path === "/api/workflows" && method === "POST") {
			const body = JSON.parse(request.postData() || "{}");
			const workflow: MockWorkflow = {
				id: generateId("wf"),
				name: body.workflow?.name || "Untitled",
				status: "active",
				nodes: body.workflow?.nodes || [],
				edges: body.workflow?.edges || [],
				createdAt: Date.now(),
			};
			store.workflows.set(workflow.id, workflow);
			return json({ success: true, data: workflow }, 201);
		}

		// GET /api/workflows/:id
		const getWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
		if (getWorkflowMatch && method === "GET") {
			const id = getWorkflowMatch[1];
			const workflow = store.workflows.get(id);
			if (!workflow) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } },
					404,
				);
			}
			return json({ success: true, data: workflow });
		}

		// PUT /api/workflows/:id
		const putWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
		if (putWorkflowMatch && method === "PUT") {
			const id = putWorkflowMatch[1];
			const workflow = store.workflows.get(id);
			if (!workflow) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } },
					404,
				);
			}
			const body = JSON.parse(request.postData() || "{}");
			Object.assign(workflow, body.workflow);
			return json({ success: true, data: workflow });
		}

		// DELETE /api/workflows/:id
		const deleteWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
		if (deleteWorkflowMatch && method === "DELETE") {
			const id = deleteWorkflowMatch[1];
			if (!store.workflows.has(id)) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } },
					404,
				);
			}
			store.workflows.delete(id);
			return json({ success: true, data: { deleted: true } });
		}

		// POST /api/workflows/:id/run
		const runWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)\/run$/);
		if (runWorkflowMatch && method === "POST") {
			const workflowId = runWorkflowMatch[1];
			const workflow = store.workflows.get(workflowId);
			if (!workflow) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Workflow ${workflowId} not found` } },
					404,
				);
			}

			const executionId = generateId("ex");
			const execution: MockExecution = {
				executionId,
				workflowId,
				status: "pending",
				startedAt: Date.now(),
			};
			store.executions.set(executionId, execution);

			// Simulate async execution completion
			setTimeout(() => {
				const exec = store.executions.get(executionId);
				if (exec) {
					exec.status = "completed";
					exec.completedAt = Date.now();
					exec.duration = exec.completedAt - exec.startedAt;

					// Create node executions
					const nodeExecs: MockNodeExecution[] = workflow.nodes.map((node: any, i: number) => ({
						nodeId: node.id || `node-${i}`,
						executionId,
						status: "completed",
						startedAt: exec.startedAt + i * 100,
						completedAt: exec.startedAt + (i + 1) * 100,
						duration: 100,
						output: { processed: true },
					}));
					store.nodeExecutions.set(executionId, nodeExecs);
				}
			}, 500);

			return json(
				{ success: true, data: { executionId, status: "pending", workflowId } },
				202,
			);
		}

		// GET /api/executions
		if (path === "/api/executions" && method === "GET") {
			const items = Array.from(store.executions.values());
			return json({
				success: true,
				data: { items, total: items.length, limit: 50, offset: 0 },
			});
		}

		// GET /api/executions/:id
		const getExecMatch = path.match(/^\/api\/executions\/([^/]+)$/);
		if (getExecMatch && method === "GET") {
			const id = getExecMatch[1];
			const execution = store.executions.get(id);
			if (!execution) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Execution ${id} not found` } },
					404,
				);
			}
			return json({ success: true, data: execution });
		}

		// GET /api/executions/:id/progress
		const progressMatch = path.match(/^\/api\/executions\/([^/]+)\/progress$/);
		if (progressMatch && method === "GET") {
			const id = progressMatch[1];
			const execution = store.executions.get(id);
			if (!execution) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Execution ${id} not found` } },
					404,
				);
			}
			const nodes = store.nodeExecutions.get(id) || [];
			const completed = nodes.filter((n) => n.status === "completed").length;
			return json({
				success: true,
				data: {
					total: nodes.length || 3,
					completed,
					percentage: nodes.length ? Math.round((completed / nodes.length) * 100) : 0,
				},
			});
		}

		// GET /api/executions/:id/nodes
		const nodesMatch = path.match(/^\/api\/executions\/([^/]+)\/nodes$/);
		if (nodesMatch && method === "GET") {
			const id = nodesMatch[1];
			const nodes = store.nodeExecutions.get(id) || [];
			return json({ success: true, data: nodes });
		}

		// GET /api/executions/:id/transitions
		const transitionsMatch = path.match(/^\/api\/executions\/([^/]+)\/transitions$/);
		if (transitionsMatch && method === "GET") {
			const id = transitionsMatch[1];
			const execution = store.executions.get(id);
			if (!execution) {
				return json({ success: true, data: [] });
			}
			return json({
				success: true,
				data: [
					{ fromState: "pending", toState: "running", timestamp: execution.startedAt },
					{ fromState: "running", toState: execution.status, timestamp: execution.completedAt || Date.now() },
				],
			});
		}

		// POST /api/executions/:id/cancel
		const cancelMatch = path.match(/^\/api\/executions\/([^/]+)\/cancel$/);
		if (cancelMatch && method === "POST") {
			const id = cancelMatch[1];
			const execution = store.executions.get(id);
			if (!execution) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Execution ${id} not found` } },
					404,
				);
			}
			if (execution.status !== "running" && execution.status !== "pending") {
				return json(
					{ success: false, error: { code: "INVALID_STATE", message: `Cannot cancel execution with status: ${execution.status}` } },
					400,
				);
			}
			execution.status = "cancelled";
			return json({ success: true, data: { executionId: id, status: "cancelled", workflowId: execution.workflowId } });
		}

		// POST /api/executions/:id/retry
		const retryMatch = path.match(/^\/api\/executions\/([^/]+)\/retry$/);
		if (retryMatch && method === "POST") {
			const id = retryMatch[1];
			const execution = store.executions.get(id);
			if (!execution) {
				return json(
					{ success: false, error: { code: "NOT_FOUND", message: `Execution ${id} not found` } },
					404,
				);
			}
			if (execution.status !== "failed") {
				return json(
					{ success: false, error: { code: "INVALID_STATE", message: `Cannot retry execution with status: ${execution.status}` } },
					400,
				);
			}
			execution.status = "pending";
			return json({ success: true, data: { executionId: id, status: "pending", workflowId: execution.workflowId } }, 202);
		}

		// Fallback - not found
		return json(
			{ success: false, error: { code: "NOT_FOUND", message: `Route not found: ${method} ${path}` } },
			404,
		);
	};
}

/**
 * Setup mock API routes on a page
 */
export async function setupMockApi(page: Page, store?: MockStore): Promise<MockStore> {
	const mockStore = store || createMockStore();
	await page.route("**/api/**", createMockHandlers(mockStore));
	return mockStore;
}

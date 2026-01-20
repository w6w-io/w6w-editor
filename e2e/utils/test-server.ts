/**
 * Test API Server
 *
 * A simple Node.js HTTP server that implements the workflow API
 * for E2E testing. Uses in-memory storage.
 */

import * as http from "node:http";

interface Workflow {
	id: string;
	name: string;
	status: string;
	nodes: unknown[];
	edges: unknown[];
	variables?: unknown[];
	createdAt: number;
	updatedAt: number;
}

interface Execution {
	executionId: string;
	workflowId: string;
	status: string;
	startedAt: number;
	completedAt?: number;
	duration?: number;
	vars?: Record<string, unknown>;
}

interface NodeExecution {
	nodeId: string;
	executionId: string;
	status: string;
	startedAt?: number;
	completedAt?: number;
	duration?: number;
	output?: unknown;
}

// In-memory storage
const workflows = new Map<string, Workflow>();
const executions = new Map<string, Execution>();
const nodeExecutions = new Map<string, NodeExecution[]>();

function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch {
				resolve({});
			}
		});
		req.on("error", reject);
	});
}

function sendJson(
	res: http.ServerResponse,
	data: unknown,
	status = 200,
): void {
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	});
	res.end(JSON.stringify(data));
}

async function handleRequest(
	req: http.IncomingMessage,
	res: http.ServerResponse,
): Promise<void> {
	const url = new URL(req.url || "/", `http://${req.headers.host}`);
	const path = url.pathname;
	const method = req.method || "GET";

	// CORS preflight
	if (method === "OPTIONS") {
		res.writeHead(204, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});
		res.end();
		return;
	}

	// Health check
	if (path === "/health") {
		return sendJson(res, { success: true, data: { status: "healthy" } });
	}

	// GET /api/workflows
	if (path === "/api/workflows" && method === "GET") {
		const items = Array.from(workflows.values());
		return sendJson(res, {
			success: true,
			data: { items, total: items.length, limit: 50, offset: 0 },
		});
	}

	// POST /api/workflows
	if (path === "/api/workflows" && method === "POST") {
		const body = (await parseBody(req)) as { workflow?: Partial<Workflow> };
		const workflow: Workflow = {
			id: generateId("wf"),
			name: body.workflow?.name || "Untitled",
			status: "active",
			nodes: (body.workflow?.nodes as unknown[]) || [],
			edges: (body.workflow?.edges as unknown[]) || [],
			variables: body.workflow?.variables as unknown[],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		workflows.set(workflow.id, workflow);
		return sendJson(res, { success: true, data: workflow }, 201);
	}

	// GET /api/workflows/:id
	const getWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
	if (getWorkflowMatch && method === "GET") {
		const id = getWorkflowMatch[1];
		const workflow = workflows.get(id);
		if (!workflow) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Workflow ${id} not found` },
				},
				404,
			);
		}
		return sendJson(res, { success: true, data: workflow });
	}

	// PUT /api/workflows/:id
	const putWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
	if (putWorkflowMatch && method === "PUT") {
		const id = putWorkflowMatch[1];
		const workflow = workflows.get(id);
		if (!workflow) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Workflow ${id} not found` },
				},
				404,
			);
		}
		const body = (await parseBody(req)) as { workflow?: Partial<Workflow> };
		Object.assign(workflow, body.workflow, { updatedAt: Date.now() });
		return sendJson(res, { success: true, data: workflow });
	}

	// DELETE /api/workflows/:id
	const deleteWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)$/);
	if (deleteWorkflowMatch && method === "DELETE") {
		const id = deleteWorkflowMatch[1];
		if (!workflows.has(id)) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Workflow ${id} not found` },
				},
				404,
			);
		}
		workflows.delete(id);
		return sendJson(res, { success: true, data: { deleted: true } });
	}

	// POST /api/workflows/:id/run
	const runWorkflowMatch = path.match(/^\/api\/workflows\/([^/]+)\/run$/);
	if (runWorkflowMatch && method === "POST") {
		const workflowId = runWorkflowMatch[1];
		const workflow = workflows.get(workflowId);
		if (!workflow) {
			return sendJson(
				res,
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message: `Workflow ${workflowId} not found`,
					},
				},
				404,
			);
		}

		const body = (await parseBody(req)) as { vars?: Record<string, unknown> };
		const executionId = generateId("ex");
		const execution: Execution = {
			executionId,
			workflowId,
			status: "pending",
			startedAt: Date.now(),
			vars: body.vars,
		};
		executions.set(executionId, execution);

		// Simulate async execution
		setTimeout(() => {
			const exec = executions.get(executionId);
			if (exec) {
				exec.status = "running";
				setTimeout(() => {
					exec.status = "completed";
					exec.completedAt = Date.now();
					exec.duration = exec.completedAt - exec.startedAt;

					// Create node executions
					const nodes = (workflow.nodes as Array<{ id: string }>) || [];
					const nodeExecs: NodeExecution[] = nodes.map((node, i) => ({
						nodeId: node.id || `node-${i}`,
						executionId,
						status: "completed",
						startedAt: exec.startedAt + i * 50,
						completedAt: exec.startedAt + (i + 1) * 50,
						duration: 50,
						output: { processed: true, nodeId: node.id },
					}));
					nodeExecutions.set(executionId, nodeExecs);
				}, 200);
			}
		}, 100);

		return sendJson(
			res,
			{ success: true, data: { executionId, status: "pending", workflowId } },
			202,
		);
	}

	// GET /api/executions
	if (path === "/api/executions" && method === "GET") {
		const workflowId = url.searchParams.get("workflowId");
		let items = Array.from(executions.values());
		if (workflowId) {
			items = items.filter((e) => e.workflowId === workflowId);
		}
		return sendJson(res, {
			success: true,
			data: { items, total: items.length, limit: 50, offset: 0 },
		});
	}

	// GET /api/executions/:id
	const getExecMatch = path.match(/^\/api\/executions\/([^/]+)$/);
	if (getExecMatch && method === "GET") {
		const id = getExecMatch[1];
		const execution = executions.get(id);
		if (!execution) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Execution ${id} not found` },
				},
				404,
			);
		}
		return sendJson(res, { success: true, data: execution });
	}

	// GET /api/executions/:id/progress
	const progressMatch = path.match(/^\/api\/executions\/([^/]+)\/progress$/);
	if (progressMatch && method === "GET") {
		const id = progressMatch[1];
		const execution = executions.get(id);
		if (!execution) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Execution ${id} not found` },
				},
				404,
			);
		}
		const nodes = nodeExecutions.get(id) || [];
		const completed = nodes.filter((n) => n.status === "completed").length;
		const total = nodes.length || 1;
		return sendJson(res, {
			success: true,
			data: {
				total,
				completed,
				percentage: Math.round((completed / total) * 100),
				currentNodeId: nodes.find((n) => n.status === "running")?.nodeId,
			},
		});
	}

	// GET /api/executions/:id/nodes
	const nodesMatch = path.match(/^\/api\/executions\/([^/]+)\/nodes$/);
	if (nodesMatch && method === "GET") {
		const id = nodesMatch[1];
		const nodes = nodeExecutions.get(id) || [];
		return sendJson(res, { success: true, data: nodes });
	}

	// GET /api/executions/:id/transitions
	const transitionsMatch = path.match(
		/^\/api\/executions\/([^/]+)\/transitions$/,
	);
	if (transitionsMatch && method === "GET") {
		const id = transitionsMatch[1];
		const execution = executions.get(id);
		if (!execution) {
			return sendJson(res, { success: true, data: [] });
		}
		const transitions = [
			{
				fromState: "pending",
				toState: "running",
				timestamp: execution.startedAt,
				scope: "execution",
			},
		];
		if (execution.completedAt) {
			transitions.push({
				fromState: "running",
				toState: execution.status,
				timestamp: execution.completedAt,
				scope: "execution",
			});
		}
		return sendJson(res, { success: true, data: transitions });
	}

	// POST /api/executions/:id/cancel
	const cancelMatch = path.match(/^\/api\/executions\/([^/]+)\/cancel$/);
	if (cancelMatch && method === "POST") {
		const id = cancelMatch[1];
		const execution = executions.get(id);
		if (!execution) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Execution ${id} not found` },
				},
				404,
			);
		}
		if (execution.status !== "running" && execution.status !== "pending") {
			return sendJson(
				res,
				{
					success: false,
					error: {
						code: "INVALID_STATE",
						message: `Cannot cancel execution with status: ${execution.status}`,
					},
				},
				400,
			);
		}
		execution.status = "cancelled";
		execution.completedAt = Date.now();
		return sendJson(res, {
			success: true,
			data: {
				executionId: id,
				status: "cancelled",
				workflowId: execution.workflowId,
			},
		});
	}

	// POST /api/executions/:id/retry
	const retryMatch = path.match(/^\/api\/executions\/([^/]+)\/retry$/);
	if (retryMatch && method === "POST") {
		const id = retryMatch[1];
		const execution = executions.get(id);
		if (!execution) {
			return sendJson(
				res,
				{
					success: false,
					error: { code: "NOT_FOUND", message: `Execution ${id} not found` },
				},
				404,
			);
		}
		if (execution.status !== "failed") {
			return sendJson(
				res,
				{
					success: false,
					error: {
						code: "INVALID_STATE",
						message: `Cannot retry execution with status: ${execution.status}`,
					},
				},
				400,
			);
		}
		execution.status = "pending";
		execution.startedAt = Date.now();
		execution.completedAt = undefined;
		return sendJson(
			res,
			{
				success: true,
				data: {
					executionId: id,
					status: "pending",
					workflowId: execution.workflowId,
				},
			},
			202,
		);
	}

	// Not found
	return sendJson(
		res,
		{
			success: false,
			error: { code: "NOT_FOUND", message: `Route ${method} ${path} not found` },
		},
		404,
	);
}

const PORT = parseInt(process.env.API_PORT || "3000", 10);

const server = http.createServer((req, res) => {
	handleRequest(req, res).catch((err) => {
		console.error("Request error:", err);
		sendJson(
			res,
			{
				success: false,
				error: { code: "INTERNAL_ERROR", message: String(err) },
			},
			500,
		);
	});
});

server.listen(PORT, () => {
	console.log(`Test API server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
	server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
	server.close(() => process.exit(0));
});

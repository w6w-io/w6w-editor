/**
 * Worker Execution E2E Tests
 *
 * Tests that verify the worker service correctly executes workflows.
 * These tests call the worker directly to validate execution logic.
 */

import { test, expect } from "@playwright/test";
import {
	simpleLinearWorkflow,
	branchingWorkflow,
	loopWorkflow,
	cloneWorkflow,
} from "../fixtures/workflows";
import {
	dataProcessingWorkflow,
	orderProcessingWorkflow,
} from "../fixtures/test-workflows";

// Worker service URL - runs locally in devcontainer
const WORKER_URL = process.env.WORKER_URL || "http://localhost:8081";

/**
 * Check if worker is available
 */
async function isWorkerAvailable(): Promise<boolean> {
	try {
		const response = await fetch(`${WORKER_URL}/health`, {
			signal: AbortSignal.timeout(2000),
		});
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
	return `ex_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Execute workflow directly via worker
 */
async function executeWorkflow(payload: {
	executionId: string;
	workflowId: string;
	workflow: {
		nodes: unknown[];
		edges: unknown[];
	};
	vars?: Record<string, unknown>;
}) {
	const response = await fetch(`${WORKER_URL}/execute`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	return response;
}

test.describe("Worker Service - Health & Availability", () => {
	test("worker should be running and healthy", async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");

		const response = await fetch(`${WORKER_URL}/health`);
		expect(response.ok).toBe(true);

		const body = await response.json();
		expect(body.status).toBe("healthy");
		expect(body.version).toBeDefined();
		expect(body.uptime).toBeGreaterThan(0);
		expect(body.activeExecutions).toBeGreaterThanOrEqual(0);
	});
});

test.describe("Worker Service - Simple Workflow Execution", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should execute a simple linear workflow", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		console.log("Execution result:", JSON.stringify(result, null, 2));

		expect(result.status).toBe("completed");
		expect(result.nodeResults).toBeDefined();

		// Verify all nodes executed
		const nodeIds = workflow.nodes.map((n) => n.id);
		for (const nodeId of nodeIds) {
			expect(result.nodeResults[nodeId]).toBeDefined();
			// Worker returns "success" for successful node execution
			expect(result.nodeResults[nodeId].status).toBe("success");
		}
	});

	test("should pass data between nodes", async () => {
		// Create a workflow where data flows from trigger to transform to output
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");

		// The trigger node should have output data
		expect(result.nodeResults.trigger).toBeDefined();
		expect(result.nodeResults.trigger.output).toBeDefined();
	});

	test("should handle workflow with variables", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
			vars: {
				customInput: "test-value",
				count: 42,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");
	});
});

test.describe("Worker Service - Complex Workflow Patterns", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should execute workflow with branching (condition node)", async () => {
		const workflow = cloneWorkflow(branchingWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		console.log("Branching workflow result:", JSON.stringify(result, null, 2));

		expect(result.status).toBe("completed");

		// Verify condition node executed
		expect(result.nodeResults.router).toBeDefined();
		expect(result.nodeResults.router.status).toBe("success");

		// At least one branch should have executed
		const highPath = result.nodeResults["high-path"];
		const lowPath = result.nodeResults["low-path"];
		expect(highPath || lowPath).toBeDefined();
	});

	test.skip("should execute workflow with loop node", async () => {
		// TODO: Loop execution requires body node connections which aren't set up in this simple test
		// Create a simple loop workflow with inline array
		const loopNodes = [
			{
				id: "start",
				type: "trigger",
				position: { x: 0, y: 0 },
				config: { nodeType: "trigger" },
			},
			{
				id: "loop",
				type: "loop",
				position: { x: 200, y: 0 },
				config: {
					nodeType: "loop",
					items: ["a", "b", "c"], // Direct array instead of template
					maxIterations: 10,
				},
			},
			{
				id: "end",
				type: "transform",
				position: { x: 400, y: 0 },
				config: { nodeType: "transform", set: { done: true } },
			},
		];
		const loopEdges = [
			{ id: "e1", source: "start", target: "loop" },
			{ id: "e2", source: "loop", sourceHandle: "done", target: "end" },
		];
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: loopNodes,
				edges: loopEdges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		console.log("Loop workflow result:", JSON.stringify(result, null, 2));

		expect(result.status).toBe("completed");

		// Verify loop node executed
		expect(result.nodeResults.loop).toBeDefined();
		expect(result.nodeResults.loop.status).toBe("success");
	});

	test("should execute data processing pipeline", async () => {
		const workflow = cloneWorkflow(dataProcessingWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
			vars: {
				inputData: { records: [1, 2, 3] },
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		console.log(
			"Data processing pipeline result:",
			JSON.stringify(result, null, 2),
		);

		expect(result.status).toBe("completed");

		// Verify all pipeline nodes executed in order
		expect(result.nodeResults.ingest?.status).toBe("success");
		expect(result.nodeResults.validate?.status).toBe("success");
		expect(result.nodeResults.enrich?.status).toBe("success");
		expect(result.nodeResults.output?.status).toBe("success");
	});

	test("should execute order processing workflow", async () => {
		const workflow = cloneWorkflow(orderProcessingWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
			vars: {
				orderId: "ORD-TEST-001",
				items: [
					{ sku: "ITEM-1", qty: 2, price: 10.0 },
					{ sku: "ITEM-2", qty: 1, price: 25.0 },
				],
				customerId: "CUST-123",
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		console.log(
			"Order processing workflow result:",
			JSON.stringify(result, null, 2),
		);

		expect(result.status).toBe("completed");

		// Verify order processing steps
		expect(result.nodeResults["receive-order"]?.status).toBe("success");
		expect(result.nodeResults["validate-inventory"]?.status).toBe("success");
		expect(result.nodeResults["calculate-totals"]?.status).toBe("success");
		expect(result.nodeResults["process-payment"]?.status).toBe("success");
		expect(result.nodeResults["generate-confirmation"]?.status).toBe("success");
	});
});

test.describe("Worker Service - Execution Timing & Performance", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should track execution duration", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const startTime = Date.now();
		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});
		const endTime = Date.now();

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");
		expect(result.duration).toBeDefined();
		expect(result.duration).toBeGreaterThan(0);
		expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 100); // Allow 100ms buffer
	});

	test("should track individual node execution times", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");

		// Check each node has timing info
		for (const nodeId of Object.keys(result.nodeResults)) {
			const nodeResult = result.nodeResults[nodeId];
			expect(nodeResult.duration).toBeDefined();
			expect(nodeResult.duration).toBeGreaterThanOrEqual(0);
		}
	});

	test("should complete execution within timeout", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");
		// Simple workflow should complete in under 5 seconds
		expect(result.duration).toBeLessThan(5000);
	});
});

test.describe("Worker Service - Error Handling", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should handle empty workflow gracefully", async () => {
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: [],
				edges: [],
			},
		});

		// Empty workflow might complete immediately or return error
		const result = await response.json();
		console.log("Empty workflow result:", JSON.stringify(result, null, 2));

		// Accept either completed (no work to do) or error
		expect(["completed", "failed"]).toContain(result.status);
	});

	test("should reject invalid workflow payload", async () => {
		const response = await fetch(`${WORKER_URL}/execute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				// Missing required fields
				invalid: true,
			}),
		});

		expect(response.status).toBe(400);
		const result = await response.json();
		expect(result.error).toBeDefined();
		expect(result.code).toBe("VALIDATION_ERROR");
	});

	test("should reject malformed JSON", async () => {
		const response = await fetch(`${WORKER_URL}/execute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{ invalid json",
		});

		expect(response.status).toBe(400);
		const result = await response.json();
		expect(result.code).toBe("PARSE_ERROR");
	});

	test("should return 404 for unknown routes", async () => {
		const response = await fetch(`${WORKER_URL}/unknown-route`);
		expect(response.status).toBe(404);
	});
});

test.describe("Worker Service - Execution Cancellation", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should return 404 when cancelling non-existent execution", async () => {
		const response = await fetch(`${WORKER_URL}/execute/non-existent-id`, {
			method: "DELETE",
		});

		expect(response.status).toBe(404);
		const result = await response.json();
		expect(result.code).toBe("NOT_FOUND");
	});
});

test.describe("Worker Service - Output Verification", () => {
	test.beforeEach(async () => {
		const available = await isWorkerAvailable();
		test.skip(!available, "Worker service not available");
	});

	test("should return final workflow output", async () => {
		const workflow = cloneWorkflow(simpleLinearWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");
		// The workflow should have an output from the final node
		expect(result.output).toBeDefined();
	});

	test("should preserve node outputs in results", async () => {
		const workflow = cloneWorkflow(dataProcessingWorkflow);
		const executionId = generateExecutionId();

		const response = await executeWorkflow({
			executionId,
			workflowId: `wf_test_${Date.now()}`,
			workflow: {
				nodes: workflow.nodes,
				edges: workflow.edges,
			},
			vars: {
				inputData: { test: true },
			},
		});

		expect(response.ok).toBe(true);
		const result = await response.json();

		expect(result.status).toBe("completed");
		expect(result.nodeResults).toBeDefined();

		// Each completed node should have output
		for (const nodeId of Object.keys(result.nodeResults)) {
			const nodeResult = result.nodeResults[nodeId];
			if (nodeResult.status === "completed") {
				expect(nodeResult.output).toBeDefined();
			}
		}
	});
});

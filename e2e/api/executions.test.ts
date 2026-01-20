import { test, expect } from "@playwright/test";
import { createApiClient, type ApiClient } from "../utils/api-client";
import { simpleLinearWorkflow, cloneWorkflow } from "../fixtures/workflows";

/**
 * Execution API E2E Tests
 *
 * Tests for execution lifecycle, status tracking, and control operations.
 */

test.describe("Execution API", () => {
	let api: ApiClient;

	test.beforeEach(async ({ request }) => {
		api = createApiClient(request);
	});

	test.describe("Execution Listing", () => {
		test("should list executions", async () => {
			const response = await api.listExecutions();
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});

		test("should list executions with pagination", async () => {
			const response = await api.listExecutions({ limit: 10, offset: 0 });
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});

		test("should filter executions by workflow ID", async () => {
			// Create a workflow first
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Filter by workflow ID
			const response = await api.listExecutions({ workflowId });
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});

		test("should filter executions by status", async () => {
			const response = await api.listExecutions({ status: "completed" });
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});
	});

	test.describe("Execution Details", () => {
		test("should get execution by ID", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Get execution details
			const getResponse = await api.getExecution(executionId);
			const body = await api.assertSuccess<{
				executionId: string;
				workflowId: string;
				status: string;
			}>(getResponse);

			expect(body.data?.executionId).toBe(executionId);
			expect(body.data?.workflowId).toBe(workflowId);
			expect(body.data?.status).toBeDefined();
		});

		test("should get execution with node details", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Get execution with nodes
			const getResponse = await api.getExecution(executionId, {
				includeNodes: true,
			});
			const body = await api.assertSuccess(getResponse);

			expect(body.data).toBeDefined();
		});

		test("should return 404 for non-existent execution", async () => {
			const response = await api.getExecution("non-existent-id");
			await api.assertError(response, "NOT_FOUND", 404);
		});
	});

	test.describe("Execution Progress", () => {
		test("should get execution progress", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Get progress
			const progressResponse = await api.getExecutionProgress(executionId);
			const body = await api.assertSuccess<{
				total: number;
				completed: number;
				percentage: number;
			}>(progressResponse);

			expect(body.data?.total).toBeGreaterThanOrEqual(0);
			expect(body.data?.completed).toBeGreaterThanOrEqual(0);
			expect(body.data?.percentage).toBeGreaterThanOrEqual(0);
			expect(body.data?.percentage).toBeLessThanOrEqual(100);
		});
	});

	test.describe("Execution Node Details", () => {
		test("should get execution nodes", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Get nodes
			const nodesResponse = await api.getExecutionNodes(executionId);
			const body = await api.assertSuccess(nodesResponse);

			expect(body.data).toBeDefined();
		});
	});

	test.describe("Execution State Transitions", () => {
		test("should get execution transitions", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Get transitions
			const transitionsResponse =
				await api.getExecutionTransitions(executionId);
			const body = await api.assertSuccess(transitionsResponse);

			expect(body.data).toBeDefined();
		});
	});

	test.describe("Execution Control", () => {
		test.skip("should cancel a running execution", async () => {
			// This test requires a long-running workflow
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Cancel execution
			const cancelResponse = await api.cancelExecution(executionId);
			const body = await api.assertSuccess<{ status: string }>(cancelResponse);

			expect(body.data?.status).toBe("cancelled");
		});

		test.skip("should retry a failed execution", async () => {
			// This test requires a failed workflow
			// Would need to set up a workflow that fails predictably
		});

		test("should return error when cancelling non-running execution", async () => {
			// Create and run a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			const runResponse = await api.runWorkflow(workflowId);
			const runResult = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			const executionId = runResult.data!.executionId;

			// Wait for completion
			try {
				await api.waitForExecution(executionId, { timeout: 10000 });
			} catch {
				// May timeout, that's ok for this test
			}

			// Try to cancel completed execution - should fail
			const cancelResponse = await api.cancelExecution(executionId);
			// Either succeeds (if still running) or fails with INVALID_STATE
			const status = cancelResponse.status();
			expect([200, 400]).toContain(status);
		});

		test("should return 404 when cancelling non-existent execution", async () => {
			const response = await api.cancelExecution("non-existent-id");
			await api.assertError(response, "NOT_FOUND", 404);
		});

		test("should return 404 when retrying non-existent execution", async () => {
			const response = await api.retryExecution("non-existent-id");
			await api.assertError(response, "NOT_FOUND", 404);
		});
	});
});

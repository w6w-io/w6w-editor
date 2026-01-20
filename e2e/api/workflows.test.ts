import { test, expect } from "@playwright/test";
import { createApiClient, type ApiClient } from "../utils/api-client";
import {
	simpleLinearWorkflow,
	branchingWorkflow,
	cloneWorkflow,
	generateWorkflowName,
} from "../fixtures/workflows";

/**
 * Workflow API E2E Tests
 *
 * Tests for the workflow CRUD operations and execution trigger.
 */

test.describe("Workflow API", () => {
	let api: ApiClient;

	test.beforeEach(async ({ request }) => {
		api = createApiClient(request);
	});

	test.describe("CRUD Operations", () => {
		test("should list workflows", async () => {
			const response = await api.listWorkflows();
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});

		test("should list workflows with pagination", async () => {
			const response = await api.listWorkflows({ limit: 5, offset: 0 });
			const body = await api.assertSuccess(response);

			expect(body.data).toBeDefined();
		});

		test("should create a workflow", async () => {
			const workflow = cloneWorkflow(simpleLinearWorkflow);

			const response = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});

			expect(response.status()).toBe(201);
			const body = await api.assertSuccess<{ id: string; name: string }>(
				response,
			);

			expect(body.data?.id).toBeDefined();
			expect(body.data?.name).toBe(workflow.name);
		});

		test("should get a workflow by ID", async () => {
			// First create a workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Then get it
			const getResponse = await api.getWorkflow(workflowId);
			const body = await api.assertSuccess<{ id: string; name: string }>(
				getResponse,
			);

			expect(body.data?.id).toBe(workflowId);
			expect(body.data?.name).toBe(workflow.name);
		});

		test("should return 404 for non-existent workflow", async () => {
			const response = await api.getWorkflow("non-existent-id");
			await api.assertError(response, "NOT_FOUND", 404);
		});

		test("should update a workflow", async () => {
			// Create workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Update it
			const newName = generateWorkflowName("Updated");
			const updateResponse = await api.updateWorkflow(workflowId, {
				name: newName,
			});
			const updated = await api.assertSuccess<{ name: string }>(updateResponse);

			expect(updated.data?.name).toBe(newName);
		});

		test("should delete a workflow", async () => {
			// Create workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Delete it
			const deleteResponse = await api.deleteWorkflow(workflowId);
			await api.assertSuccess(deleteResponse);

			// Verify it's gone
			const getResponse = await api.getWorkflow(workflowId);
			await api.assertError(getResponse, "NOT_FOUND", 404);
		});
	});

	test.describe("Workflow Execution", () => {
		test("should trigger workflow execution", async () => {
			// Create workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Trigger execution
			const runResponse = await api.runWorkflow(workflowId);
			expect(runResponse.status()).toBe(202);

			const body = await api.assertSuccess<{
				executionId: string;
				status: string;
				workflowId: string;
			}>(runResponse);

			expect(body.data?.executionId).toBeDefined();
			// API returns "running" as initial status (execution starts immediately)
			expect(["pending", "running"]).toContain(body.data?.status);
			expect(body.data?.workflowId).toBe(workflowId);
		});

		test("should trigger workflow with variables", async () => {
			// Create workflow
			const workflow = cloneWorkflow(simpleLinearWorkflow);
			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});
			const created = await api.assertSuccess<{ id: string }>(createResponse);
			const workflowId = created.data!.id;

			// Trigger with variables
			const runResponse = await api.runWorkflow(workflowId, {
				vars: { testVar: "value", count: 42 },
			});

			expect(runResponse.status()).toBe(202);
			const body = await api.assertSuccess<{ executionId: string }>(
				runResponse,
			);
			expect(body.data?.executionId).toBeDefined();
		});

		test("should return 404 when triggering non-existent workflow", async () => {
			const response = await api.runWorkflow("non-existent-id");
			await api.assertError(response, "NOT_FOUND", 404);
		});
	});
});

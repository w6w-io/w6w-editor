import { test, expect } from "@playwright/test";
import { createApiClient, type ApiClient } from "../utils/api-client";
import {
	dataProcessingWorkflow,
	notificationWorkflow,
	orderProcessingWorkflow,
	testWorkflows,
} from "../fixtures/test-workflows";
import { cloneWorkflow, generateWorkflowName } from "../fixtures/workflows";

/**
 * Workflow Integration Tests
 *
 * End-to-end tests that:
 * 1. Create workflows via API
 * 2. Execute them with variables
 * 3. Monitor execution progress
 * 4. View execution logs and node details
 */

test.describe("Workflow Integration - Full Flow", () => {
	let api: ApiClient;

	// Track created resources for cleanup
	const createdWorkflowIds: string[] = [];
	const createdExecutionIds: string[] = [];

	test.beforeEach(async ({ request }) => {
		api = createApiClient(request);
	});

	test.afterAll(async ({ request }) => {
		// Cleanup created workflows
		const api = createApiClient(request);
		for (const id of createdWorkflowIds) {
			try {
				await api.deleteWorkflow(id);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	test.describe("Data Processing Workflow", () => {
		test("should create, run, and view logs for data processing workflow", async () => {
			// Step 1: Create the workflow
			const workflow = cloneWorkflow(dataProcessingWorkflow);
			console.log(`\n📋 Creating workflow: ${workflow.name}`);

			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});

			expect(createResponse.status()).toBe(201);
			const createResult = await api.assertSuccess<{
				id: string;
				name: string;
			}>(createResponse);
			const workflowId = createResult.data!.id;
			createdWorkflowIds.push(workflowId);

			console.log(`✅ Workflow created: ${workflowId}`);

			// Step 2: Run the workflow with input variables
			console.log(`\n🚀 Running workflow with input data...`);

			const inputData = {
				customerId: "cust-12345",
				products: [
					{ sku: "PROD-001", quantity: 2, price: 29.99 },
					{ sku: "PROD-002", quantity: 1, price: 49.99 },
				],
				timestamp: new Date().toISOString(),
			};

			const runResponse = await api.runWorkflow(workflowId, {
				vars: {
					inputData,
					validationRules: ["required:customerId", "array:products"],
				},
			});

			expect(runResponse.status()).toBe(202);
			const runResult = await api.assertSuccess<{
				executionId: string;
				status: string;
				workflowId: string;
			}>(runResponse);

			const executionId = runResult.data!.executionId;
			createdExecutionIds.push(executionId);

			console.log(`✅ Execution started: ${executionId}`);
			console.log(`   Initial status: ${runResult.data!.status}`);

			// Step 3: Poll for execution completion (with timeout)
			console.log(`\n⏳ Waiting for execution to complete...`);

			let finalStatus = "pending";
			const maxWaitTime = 30000; // 30 seconds
			const pollInterval = 1000; // 1 second
			const startTime = Date.now();

			while (Date.now() - startTime < maxWaitTime) {
				const statusResponse = await api.getExecution(executionId);
				const statusResult = await api.assertSuccess<{
					executionId: string;
					status: string;
				}>(statusResponse);

				finalStatus = statusResult.data!.status;

				if (["completed", "failed", "cancelled"].includes(finalStatus)) {
					break;
				}

				// Get progress
				const progressResponse = await api.getExecutionProgress(executionId);
				if (progressResponse.ok()) {
					const progressResult = await progressResponse.json();
					if (progressResult.success && progressResult.data) {
						console.log(
							`   Progress: ${progressResult.data.percentage}% (${progressResult.data.completed}/${progressResult.data.total} nodes)`,
						);
					}
				}

				await new Promise((resolve) => setTimeout(resolve, pollInterval));
			}

			console.log(`✅ Execution completed with status: ${finalStatus}`);

			// Step 4: View execution details
			console.log(`\n📊 Fetching execution details...`);

			const detailsResponse = await api.getExecution(executionId, {
				includeNodes: true,
			});
			const detailsResult = await api.assertSuccess<{
				executionId: string;
				status: string;
				workflowSnapshot?: { nodes: unknown[] };
				startedAt?: number;
				completedAt?: number;
				duration?: number;
			}>(detailsResponse);

			console.log(`   Execution ID: ${detailsResult.data!.executionId}`);
			console.log(`   Status: ${detailsResult.data!.status}`);
			if (detailsResult.data!.duration) {
				console.log(`   Duration: ${detailsResult.data!.duration}ms`);
			}

			// Step 5: View node execution logs
			console.log(`\n📝 Fetching node execution logs...`);

			const nodesResponse = await api.getExecutionNodes(executionId);
			const nodesResult = await api.assertSuccess<
				Array<{
					nodeId: string;
					status: string;
					startedAt?: number;
					completedAt?: number;
					output?: unknown;
				}>
			>(nodesResponse);

			if (Array.isArray(nodesResult.data)) {
				console.log(`   Total nodes executed: ${nodesResult.data.length}`);

				for (const node of nodesResult.data) {
					console.log(`   - Node "${node.nodeId}": ${node.status}`);
				}
			}

			// Step 6: View state transitions
			console.log(`\n🔄 Fetching state transitions...`);

			const transitionsResponse =
				await api.getExecutionTransitions(executionId);
			const transitionsResult = await api.assertSuccess<
				Array<{
					fromState: string;
					toState: string;
					nodeId?: string;
					timestamp?: number;
				}>
			>(transitionsResponse);

			if (Array.isArray(transitionsResult.data)) {
				console.log(
					`   Total transitions: ${transitionsResult.data.length}`,
				);

				for (const transition of transitionsResult.data.slice(0, 5)) {
					const nodeInfo = transition.nodeId
						? ` (node: ${transition.nodeId})`
						: "";
					console.log(
						`   - ${transition.fromState} → ${transition.toState}${nodeInfo}`,
					);
				}

				if (transitionsResult.data.length > 5) {
					console.log(
						`   ... and ${transitionsResult.data.length - 5} more`,
					);
				}
			}

			console.log(`\n✅ Data Processing Workflow test completed!`);
		});
	});

	test.describe("Notification Workflow", () => {
		test("should create, run with urgent priority, and view logs", async () => {
			// Create workflow
			const workflow = cloneWorkflow(notificationWorkflow);
			console.log(`\n📋 Creating workflow: ${workflow.name}`);

			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});

			expect(createResponse.status()).toBe(201);
			const createResult = await api.assertSuccess<{ id: string }>(
				createResponse,
			);
			const workflowId = createResult.data!.id;
			createdWorkflowIds.push(workflowId);

			console.log(`✅ Workflow created: ${workflowId}`);

			// Run with urgent priority
			console.log(`\n🚀 Running workflow with URGENT priority...`);

			const runResponse = await api.runWorkflow(workflowId, {
				vars: {
					recipient: "admin@example.com",
					message: "Server CPU usage exceeded 90%!",
					priority: "urgent",
				},
			});

			expect(runResponse.status()).toBe(202);
			const runResult = await api.assertSuccess<{
				executionId: string;
				status: string;
			}>(runResponse);
			const executionId = runResult.data!.executionId;
			createdExecutionIds.push(executionId);

			console.log(`✅ Execution started: ${executionId}`);

			// Wait and get results
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const detailsResponse = await api.getExecution(executionId, {
				includeNodes: true,
			});
			const detailsResult = await api.assertSuccess<{
				status: string;
			}>(detailsResponse);

			console.log(`   Final status: ${detailsResult.data!.status}`);

			// Check which channel was used
			const nodesResponse = await api.getExecutionNodes(executionId);
			const nodesResult = await api.assertSuccess<
				Array<{ nodeId: string; status: string; output?: unknown }>
			>(nodesResponse);

			if (Array.isArray(nodesResult.data)) {
				const urgentChannel = nodesResult.data.find(
					(n) => n.nodeId === "urgent-channel",
				);
				const normalChannel = nodesResult.data.find(
					(n) => n.nodeId === "normal-channel",
				);

				console.log(`\n📊 Routing results:`);
				if (urgentChannel) {
					console.log(
						`   ✅ Urgent channel executed: ${urgentChannel.status}`,
					);
				}
				if (normalChannel) {
					console.log(
						`   - Normal channel: ${normalChannel.status}`,
					);
				}
			}

			console.log(`\n✅ Notification Workflow (urgent) test completed!`);
		});

		test("should create, run with normal priority, and view logs", async () => {
			// Create workflow
			const workflow = cloneWorkflow(notificationWorkflow);
			workflow.name = generateWorkflowName("Notification Normal");

			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});

			expect(createResponse.status()).toBe(201);
			const createResult = await api.assertSuccess<{ id: string }>(
				createResponse,
			);
			const workflowId = createResult.data!.id;
			createdWorkflowIds.push(workflowId);

			// Run with normal priority
			console.log(`\n🚀 Running workflow with NORMAL priority...`);

			const runResponse = await api.runWorkflow(workflowId, {
				vars: {
					recipient: "user@example.com",
					message: "Your weekly report is ready.",
					priority: "normal",
				},
			});

			expect(runResponse.status()).toBe(202);
			const runResult = await api.assertSuccess<{
				executionId: string;
			}>(runResponse);
			const executionId = runResult.data!.executionId;
			createdExecutionIds.push(executionId);

			console.log(`✅ Execution started: ${executionId}`);

			// Wait and get results
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Check which channel was used
			const nodesResponse = await api.getExecutionNodes(executionId);
			const nodesResult = await api.assertSuccess<
				Array<{ nodeId: string; status: string }>
			>(nodesResponse);

			if (Array.isArray(nodesResult.data)) {
				const normalChannel = nodesResult.data.find(
					(n) => n.nodeId === "normal-channel",
				);
				const urgentChannel = nodesResult.data.find(
					(n) => n.nodeId === "urgent-channel",
				);

				console.log(`\n📊 Routing results:`);
				if (normalChannel) {
					console.log(
						`   ✅ Normal channel executed: ${normalChannel.status}`,
					);
				}
				if (urgentChannel) {
					console.log(
						`   - Urgent channel: ${urgentChannel.status}`,
					);
				}
			}

			console.log(`\n✅ Notification Workflow (normal) test completed!`);
		});
	});

	test.describe("Order Processing Workflow", () => {
		test("should create, run, and view complete order processing logs", async () => {
			// Create workflow
			const workflow = cloneWorkflow(orderProcessingWorkflow);
			console.log(`\n📋 Creating workflow: ${workflow.name}`);

			const createResponse = await api.createWorkflow({
				name: workflow.name,
				nodes: workflow.nodes,
				edges: workflow.edges,
			});

			expect(createResponse.status()).toBe(201);
			const createResult = await api.assertSuccess<{ id: string }>(
				createResponse,
			);
			const workflowId = createResult.data!.id;
			createdWorkflowIds.push(workflowId);

			console.log(`✅ Workflow created: ${workflowId}`);

			// Run the order processing workflow
			console.log(`\n🚀 Processing order...`);

			const orderId = `ORD-${Date.now()}`;
			const runResponse = await api.runWorkflow(workflowId, {
				vars: {
					orderId,
					customerId: "CUST-98765",
					items: [
						{ productId: "SKU-001", name: "Widget Pro", quantity: 2, price: 29.99 },
						{ productId: "SKU-002", name: "Gadget Plus", quantity: 1, price: 49.99 },
						{ productId: "SKU-003", name: "Tool Kit", quantity: 1, price: 19.99 },
					],
				},
			});

			expect(runResponse.status()).toBe(202);
			const runResult = await api.assertSuccess<{
				executionId: string;
			}>(runResponse);
			const executionId = runResult.data!.executionId;
			createdExecutionIds.push(executionId);

			console.log(`✅ Order ${orderId} processing started`);
			console.log(`   Execution ID: ${executionId}`);

			// Wait for completion
			console.log(`\n⏳ Processing order...`);
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Get final execution status
			const detailsResponse = await api.getExecution(executionId, {
				includeNodes: true,
			});
			const details = await api.assertSuccess<{
				status: string;
				duration?: number;
			}>(detailsResponse);

			console.log(`\n📊 Order Processing Results:`);
			console.log(`   Status: ${details.data!.status}`);
			if (details.data!.duration) {
				console.log(`   Processing time: ${details.data!.duration}ms`);
			}

			// Get node-by-node breakdown
			const nodesResponse = await api.getExecutionNodes(executionId);
			const nodes = await api.assertSuccess<
				Array<{
					nodeId: string;
					status: string;
					duration?: number;
					output?: unknown;
				}>
			>(nodesResponse);

			if (Array.isArray(nodes.data)) {
				console.log(`\n📝 Processing Steps:`);

				const expectedNodes = [
					"receive-order",
					"validate-inventory",
					"calculate-totals",
					"process-payment",
					"generate-confirmation",
				];

				for (const nodeId of expectedNodes) {
					const node = nodes.data.find((n) => n.nodeId === nodeId);
					if (node) {
						const icon =
							node.status === "completed" || node.status === "success"
								? "✅"
								: node.status === "failed"
									? "❌"
									: "⏳";
						const duration = node.duration ? ` (${node.duration}ms)` : "";
						console.log(`   ${icon} ${nodeId}: ${node.status}${duration}`);
					}
				}
			}

			// Get transitions for audit trail
			const transitionsResponse =
				await api.getExecutionTransitions(executionId);
			const transitions = await api.assertSuccess<
				Array<{ fromState: string; toState: string; nodeId?: string }>
			>(transitionsResponse);

			if (Array.isArray(transitions.data) && transitions.data.length > 0) {
				console.log(`\n🔄 Audit Trail (${transitions.data.length} transitions)`);
			}

			console.log(`\n✅ Order Processing Workflow test completed!`);
			console.log(`   Order ID: ${orderId}`);
		});
	});

	test.describe("Batch Workflow Execution", () => {
		test("should create and run all test workflows", async () => {
			console.log(`\n🔄 Running batch workflow test...`);
			console.log(`   Workflows to process: ${testWorkflows.length}`);

			const results: Array<{
				name: string;
				workflowId: string;
				executionId: string;
				status: string;
			}> = [];

			for (const workflowDef of testWorkflows) {
				const workflow = cloneWorkflow(workflowDef);
				console.log(`\n📋 Processing: ${workflow.name}`);

				// Create
				const createResponse = await api.createWorkflow({
					name: workflow.name,
					nodes: workflow.nodes,
					edges: workflow.edges,
				});

				expect(createResponse.status()).toBe(201);
				const createResult = await api.assertSuccess<{ id: string }>(
					createResponse,
				);
				const workflowId = createResult.data!.id;
				createdWorkflowIds.push(workflowId);

				// Run
				const runResponse = await api.runWorkflow(workflowId, {
					vars: {
						testRun: true,
						batchId: `batch-${Date.now()}`,
					},
				});

				expect(runResponse.status()).toBe(202);
				const runResult = await api.assertSuccess<{
					executionId: string;
					status: string;
				}>(runResponse);
				const executionId = runResult.data!.executionId;
				createdExecutionIds.push(executionId);

				results.push({
					name: workflow.name,
					workflowId,
					executionId,
					status: runResult.data!.status,
				});

				console.log(`   ✅ Started: ${executionId}`);
			}

			// Wait for all to complete
			console.log(`\n⏳ Waiting for all workflows to complete...`);
			await new Promise((resolve) => setTimeout(resolve, 5000));

			// Check final statuses
			console.log(`\n📊 Batch Results:`);
			console.log(`${"─".repeat(80)}`);
			console.log(
				`${"Workflow".padEnd(30)} ${"Execution ID".padEnd(30)} ${"Status".padEnd(15)}`,
			);
			console.log(`${"─".repeat(80)}`);

			for (const result of results) {
				const statusResponse = await api.getExecution(result.executionId);
				const statusResult = await api.assertSuccess<{ status: string }>(
					statusResponse,
				);
				const finalStatus = statusResult.data!.status;

				const icon =
					finalStatus === "completed"
						? "✅"
						: finalStatus === "failed"
							? "❌"
							: "⏳";

				console.log(
					`${icon} ${result.name.substring(0, 28).padEnd(30)} ${result.executionId.substring(0, 28).padEnd(30)} ${finalStatus.padEnd(15)}`,
				);
			}

			console.log(`${"─".repeat(80)}`);
			console.log(`\n✅ Batch workflow execution test completed!`);
		});
	});
});

/**
 * Test Workflows for E2E Integration Tests
 *
 * These workflows are designed to be created, executed, and verified via API.
 */

import type { TestWorkflow } from "./workflows";

/**
 * Data Processing Workflow
 *
 * Simulates a data ingestion and transformation pipeline:
 * 1. Trigger with input data
 * 2. Validate the data
 * 3. Transform/enrich the data
 * 4. Output the result
 */
export const dataProcessingWorkflow: TestWorkflow = {
	name: "Data Processing Pipeline",
	description: "Ingests, validates, and transforms data",
	variables: [
		{ name: "inputData", type: "object" },
		{ name: "validationRules", type: "array" },
	],
	nodes: [
		{
			id: "ingest",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: {
				nodeType: "trigger",
				data: {
					source: "api",
					timestamp: "{{$now}}",
					payload: "{{vars.inputData}}",
				},
			},
		},
		{
			id: "validate",
			type: "transform",
			position: { x: 200, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					isValid: true,
					validatedAt: "{{$now}}",
					originalData: "{{nodes.ingest.output.data.payload}}",
					validationPassed: [],
				},
			},
		},
		{
			id: "enrich",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					enrichedData: {
						original: "{{nodes.validate.output.originalData}}",
						metadata: {
							processedBy: "data-pipeline",
							version: "1.0.0",
							processingTime: "{{$now}}",
						},
					},
				},
			},
		},
		{
			id: "output",
			type: "transform",
			position: { x: 600, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					success: true,
					result: "{{nodes.enrich.output.enrichedData}}",
					summary: {
						inputReceived: true,
						validationPassed: "{{nodes.validate.output.isValid}}",
						outputGenerated: true,
					},
				},
			},
		},
	],
	edges: [
		{ id: "e1", source: "ingest", target: "validate" },
		{ id: "e2", source: "validate", target: "enrich" },
		{ id: "e3", source: "enrich", target: "output" },
	],
};

/**
 * Notification Workflow
 *
 * Simulates a multi-channel notification system:
 * 1. Receive notification request
 * 2. Route based on priority
 * 3. Send to appropriate channels
 * 4. Log the notification
 */
export const notificationWorkflow: TestWorkflow = {
	name: "Multi-Channel Notification",
	description: "Routes and sends notifications based on priority",
	variables: [
		{ name: "recipient", type: "string" },
		{ name: "message", type: "string" },
		{ name: "priority", type: "string", defaultValue: "normal" },
	],
	nodes: [
		{
			id: "receive",
			type: "trigger",
			position: { x: 0, y: 100 },
			config: {
				nodeType: "trigger",
				data: {
					recipient: "{{vars.recipient}}",
					message: "{{vars.message}}",
					priority: "{{vars.priority}}",
					receivedAt: "{{$now}}",
				},
			},
		},
		{
			id: "router",
			type: "condition",
			position: { x: 200, y: 100 },
			config: {
				nodeType: "condition",
				field: "{{nodes.receive.output.data.priority}}",
				conditions: [
					{ id: "urgent", expression: "priority === 'urgent'" },
					{ id: "normal", expression: "priority !== 'urgent'" },
				],
			},
		},
		{
			id: "urgent-channel",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					channel: "sms",
					sent: true,
					sentAt: "{{$now}}",
					notification: {
						to: "{{nodes.receive.output.data.recipient}}",
						body: "[URGENT] {{nodes.receive.output.data.message}}",
					},
				},
			},
		},
		{
			id: "normal-channel",
			type: "transform",
			position: { x: 400, y: 200 },
			config: {
				nodeType: "transform",
				set: {
					channel: "email",
					sent: true,
					sentAt: "{{$now}}",
					notification: {
						to: "{{nodes.receive.output.data.recipient}}",
						subject: "Notification",
						body: "{{nodes.receive.output.data.message}}",
					},
				},
			},
		},
		{
			id: "log",
			type: "transform",
			position: { x: 600, y: 100 },
			config: {
				nodeType: "transform",
				set: {
					logged: true,
					logEntry: {
						timestamp: "{{$now}}",
						recipient: "{{nodes.receive.output.data.recipient}}",
						priority: "{{nodes.receive.output.data.priority}}",
						status: "delivered",
					},
				},
			},
		},
	],
	edges: [
		{ id: "e1", source: "receive", target: "router" },
		{
			id: "e2",
			source: "router",
			sourceHandle: "urgent",
			target: "urgent-channel",
		},
		{
			id: "e3",
			source: "router",
			sourceHandle: "normal",
			target: "normal-channel",
		},
		{ id: "e4", source: "urgent-channel", target: "log" },
		{ id: "e5", source: "normal-channel", target: "log" },
	],
};

/**
 * Order Processing Workflow
 *
 * Simulates an e-commerce order processing flow:
 * 1. Receive order
 * 2. Validate inventory
 * 3. Calculate totals
 * 4. Process payment (simulated)
 * 5. Generate confirmation
 */
export const orderProcessingWorkflow: TestWorkflow = {
	name: "Order Processing",
	description: "Processes e-commerce orders end-to-end",
	variables: [
		{ name: "orderId", type: "string" },
		{ name: "items", type: "array" },
		{ name: "customerId", type: "string" },
	],
	nodes: [
		{
			id: "receive-order",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: {
				nodeType: "trigger",
				data: {
					orderId: "{{vars.orderId}}",
					customerId: "{{vars.customerId}}",
					items: "{{vars.items}}",
					status: "received",
					receivedAt: "{{$now}}",
				},
			},
		},
		{
			id: "validate-inventory",
			type: "transform",
			position: { x: 200, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					inventoryCheck: {
						orderId: "{{nodes.receive-order.output.data.orderId}}",
						allInStock: true,
						checkedAt: "{{$now}}",
					},
				},
			},
		},
		{
			id: "calculate-totals",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					pricing: {
						subtotal: 99.99,
						tax: 8.0,
						shipping: 5.99,
						total: 113.98,
						currency: "USD",
					},
				},
			},
		},
		{
			id: "process-payment",
			type: "transform",
			position: { x: 600, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					payment: {
						status: "completed",
						transactionId: "txn_{{nodes.receive-order.output.data.orderId}}",
						amount: "{{nodes.calculate-totals.output.pricing.total}}",
						processedAt: "{{$now}}",
					},
				},
			},
		},
		{
			id: "generate-confirmation",
			type: "transform",
			position: { x: 800, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					confirmation: {
						orderId: "{{nodes.receive-order.output.data.orderId}}",
						customerId: "{{nodes.receive-order.output.data.customerId}}",
						status: "confirmed",
						transactionId: "{{nodes.process-payment.output.payment.transactionId}}",
						total: "{{nodes.calculate-totals.output.pricing.total}}",
						confirmedAt: "{{$now}}",
						message: "Thank you for your order!",
					},
				},
			},
		},
	],
	edges: [
		{ id: "e1", source: "receive-order", target: "validate-inventory" },
		{ id: "e2", source: "validate-inventory", target: "calculate-totals" },
		{ id: "e3", source: "calculate-totals", target: "process-payment" },
		{ id: "e4", source: "process-payment", target: "generate-confirmation" },
	],
};

/**
 * All test workflows for easy iteration
 */
export const testWorkflows = [
	dataProcessingWorkflow,
	notificationWorkflow,
	orderProcessingWorkflow,
] as const;

/**
 * Get a workflow by name
 */
export function getTestWorkflow(name: string): TestWorkflow | undefined {
	return testWorkflows.find((w) => w.name === name);
}

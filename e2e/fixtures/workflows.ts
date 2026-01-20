/**
 * Workflow Test Fixtures
 *
 * Pre-defined workflow configurations for E2E testing.
 */

/**
 * Workflow node definition
 */
export interface TestNode {
	id: string;
	type: string;
	position: { x: number; y: number };
	config?: Record<string, unknown>;
	package?: string;
	action?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Workflow edge definition
 */
export interface TestEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

/**
 * Complete workflow definition
 */
export interface TestWorkflow {
	name: string;
	description?: string;
	nodes: TestNode[];
	edges: TestEdge[];
	variables?: Array<{ name: string; type?: string; defaultValue?: unknown }>;
}

/**
 * Simple linear workflow (3 nodes)
 */
export const simpleLinearWorkflow: TestWorkflow = {
	name: "Simple Linear Workflow",
	description: "A basic 3-node linear workflow for testing",
	nodes: [
		{
			id: "trigger",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: {
				nodeType: "trigger",
				data: { message: "Hello World" },
			},
		},
		{
			id: "transform",
			type: "transform",
			position: { x: 200, y: 0 },
			config: {
				nodeType: "transform",
				set: { processed: true, input: "{{nodes.trigger.output.data}}" },
			},
		},
		{
			id: "output",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: { final: true },
			},
		},
	],
	edges: [
		{ id: "e1", source: "trigger", target: "transform" },
		{ id: "e2", source: "transform", target: "output" },
	],
};

/**
 * Branching workflow with conditions
 */
export const branchingWorkflow: TestWorkflow = {
	name: "Branching Workflow",
	description: "Workflow with conditional branching",
	nodes: [
		{
			id: "start",
			type: "trigger",
			position: { x: 0, y: 100 },
			config: { nodeType: "trigger", data: { value: 50 } },
		},
		{
			id: "router",
			type: "condition",
			position: { x: 200, y: 100 },
			config: {
				nodeType: "condition",
				conditions: [
					{ id: "high", expression: "value >= 75" },
					{ id: "low", expression: "value < 75" },
				],
			},
		},
		{
			id: "high-path",
			type: "transform",
			position: { x: 400, y: 0 },
			config: { nodeType: "transform", set: { path: "high" } },
		},
		{
			id: "low-path",
			type: "transform",
			position: { x: 400, y: 200 },
			config: { nodeType: "transform", set: { path: "low" } },
		},
		{
			id: "merge",
			type: "transform",
			position: { x: 600, y: 100 },
			config: { nodeType: "transform", set: { merged: true } },
		},
	],
	edges: [
		{ id: "e1", source: "start", target: "router" },
		{ id: "e2", source: "router", sourceHandle: "high", target: "high-path" },
		{ id: "e3", source: "router", sourceHandle: "low", target: "low-path" },
		{ id: "e4", source: "high-path", target: "merge" },
		{ id: "e5", source: "low-path", target: "merge" },
	],
};

/**
 * Workflow with loop
 */
export const loopWorkflow: TestWorkflow = {
	name: "Loop Workflow",
	description: "Workflow with loop iteration",
	nodes: [
		{
			id: "start",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: {
				nodeType: "trigger",
				data: { items: ["a", "b", "c"] },
			},
		},
		{
			id: "loop",
			type: "loop",
			position: { x: 200, y: 0 },
			config: {
				nodeType: "loop",
				items: "{{nodes.start.output.data.items}}",
				maxIterations: 10,
			},
		},
		{
			id: "process",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: { item: "{{loop.item}}", index: "{{loop.index}}" },
			},
		},
		{
			id: "end",
			type: "transform",
			position: { x: 600, y: 0 },
			config: { nodeType: "transform", set: { done: true } },
		},
	],
	edges: [
		{ id: "e1", source: "start", target: "loop" },
		{ id: "e2", source: "loop", sourceHandle: "body", target: "process" },
		{ id: "e3", source: "process", target: "loop", targetHandle: "next" },
		{ id: "e4", source: "loop", sourceHandle: "done", target: "end" },
	],
};

/**
 * Workflow with variables
 */
export const variableWorkflow: TestWorkflow = {
	name: "Variable Workflow",
	description: "Workflow using input variables",
	variables: [
		{ name: "userName", type: "string", defaultValue: "Guest" },
		{ name: "count", type: "number", defaultValue: 1 },
	],
	nodes: [
		{
			id: "trigger",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: { nodeType: "trigger" },
		},
		{
			id: "greet",
			type: "transform",
			position: { x: 200, y: 0 },
			config: {
				nodeType: "transform",
				set: {
					greeting: "Hello, {{vars.userName}}!",
					repeatCount: "{{vars.count}}",
				},
			},
		},
	],
	edges: [{ id: "e1", source: "trigger", target: "greet" }],
};

/**
 * Workflow with external API call
 */
export const apiCallWorkflow: TestWorkflow = {
	name: "API Call Workflow",
	description: "Workflow that makes external API calls",
	nodes: [
		{
			id: "trigger",
			type: "trigger",
			position: { x: 0, y: 0 },
			config: { nodeType: "trigger", data: { userId: "123" } },
		},
		{
			id: "fetch-user",
			type: "action",
			position: { x: 200, y: 0 },
			package: "http",
			action: "get",
			config: {
				nodeType: "action",
				url: "https://jsonplaceholder.typicode.com/users/{{nodes.trigger.output.data.userId}}",
			},
			metadata: {
				timeout: 5000,
				retry: { maxAttempts: 3 },
			},
		},
		{
			id: "process",
			type: "transform",
			position: { x: 400, y: 0 },
			config: {
				nodeType: "transform",
				set: { user: "{{nodes.fetch-user.output.data}}" },
			},
		},
	],
	edges: [
		{ id: "e1", source: "trigger", target: "fetch-user" },
		{ id: "e2", source: "fetch-user", target: "process" },
	],
};

/**
 * Generate a unique workflow name
 */
export function generateWorkflowName(prefix = "Test Workflow"): string {
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix} ${Date.now()}_${random}`;
}

/**
 * Create a copy of a workflow with a new name
 */
export function cloneWorkflow(
	workflow: TestWorkflow,
	name?: string,
): TestWorkflow {
	return {
		...workflow,
		name: name || generateWorkflowName(workflow.name),
		nodes: workflow.nodes.map((node) => ({ ...node })),
		edges: workflow.edges.map((edge) => ({ ...edge })),
	};
}

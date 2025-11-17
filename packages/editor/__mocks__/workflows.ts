/**
 * Mock workflow data for testing and stories
 * These workflows conform to the workflow schema from @w6w-io/schema
 *
 * Note: Types are defined inline to keep this package lightweight.
 * They match the schema definitions from @w6w-io/schema.
 */

type Position = {
  x: number;
  y: number;
  z?: number;
};

type Node = {
  id: string;
  authenticationId?: string;
  label?: string;
  position: Position;
  config?: Record<string, any>;
  notes?: string;
  disabled: boolean;
  input?: string[];
  output?: string[];
};

type Edge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

type Workflow = {
  id: string;
  name: string;
  description?: string;
  version: string;
  icon?: string;
  tags?: string[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: Node[];
  edges: Edge[];
};

/**
 * Empty workflow - useful for testing empty states
 */
export const emptyWorkflow: Workflow = {
  id: 'wf_empty_001',
  name: 'Empty Workflow',
  description: 'A workflow with no nodes or edges',
  version: '1.0.0',
  status: 'draft',
  nodes: [],
  edges: [],
};

/**
 * Simple linear workflow - useful for basic flow testing
 */
export const simpleWorkflow: Workflow = {
  id: 'wf_simple_001',
  name: 'Simple Linear Workflow',
  description: 'A basic workflow with three sequential nodes',
  version: '1.0.0',
  status: 'active',
  icon: '📝',
  tags: ['tutorial', 'simple', 'linear'],
  nodes: [
    {
      id: 'nd_start_001',
      label: 'Start',
      position: { x: 100, y: 100, z: 0 },
      config: { type: 'trigger' },
      disabled: false,
      output: ['out1'],
    },
    {
      id: 'nd_process_001',
      label: 'Process Data',
      position: { x: 300, y: 100, z: 0 },
      config: { type: 'transform', operation: 'uppercase' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_end_001',
      label: 'End',
      position: { x: 500, y: 100, z: 0 },
      config: { type: 'output' },
      disabled: false,
      input: ['in1'],
    },
  ],
  edges: [
    {
      id: 'ed_001_002',
      source: 'nd_start_001:out1',
      target: 'nd_process_001:in1',
      label: 'data',
    },
    {
      id: 'ed_002_003',
      source: 'nd_process_001:out1',
      target: 'nd_end_001:in1',
      label: 'processed',
    },
  ],
};

/**
 * Branching workflow - useful for testing conditional logic
 */
export const branchingWorkflow: Workflow = {
  id: 'wf_branch_001',
  name: 'Branching Workflow',
  description: 'A workflow that branches into multiple paths',
  version: '1.0.0',
  status: 'active',
  icon: '🌳',
  tags: ['conditional', 'branching'],
  nodes: [
    {
      id: 'nd_start_002',
      label: 'Trigger',
      position: { x: 100, y: 150, z: 0 },
      config: { type: 'webhook' },
      disabled: false,
      output: ['out1'],
    },
    {
      id: 'nd_condition_001',
      label: 'Check Value',
      position: { x: 300, y: 150, z: 0 },
      config: { type: 'condition', operator: 'greater_than', value: 100 },
      disabled: false,
      input: ['in1'],
      output: ['true', 'false'],
    },
    {
      id: 'nd_path_a_001',
      label: 'Path A - High Value',
      position: { x: 500, y: 50, z: 0 },
      config: { type: 'action', action: 'send_email' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_path_b_001',
      label: 'Path B - Low Value',
      position: { x: 500, y: 250, z: 0 },
      config: { type: 'action', action: 'log' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_merge_001',
      label: 'Merge Results',
      position: { x: 700, y: 150, z: 0 },
      config: { type: 'merge' },
      disabled: false,
      input: ['in1', 'in2'],
      output: ['out1'],
    },
  ],
  edges: [
    {
      id: 'ed_004_005',
      source: 'nd_start_002:out1',
      target: 'nd_condition_001:in1',
    },
    {
      id: 'ed_005_006',
      source: 'nd_condition_001:true',
      target: 'nd_path_a_001:in1',
      label: 'true',
    },
    {
      id: 'ed_005_007',
      source: 'nd_condition_001:false',
      target: 'nd_path_b_001:in1',
      label: 'false',
    },
    {
      id: 'ed_006_008',
      source: 'nd_path_a_001:out1',
      target: 'nd_merge_001:in1',
    },
    {
      id: 'ed_007_008',
      source: 'nd_path_b_001:out1',
      target: 'nd_merge_001:in2',
    },
  ],
};

/**
 * Complex parallel workflow - useful for testing concurrent execution
 */
export const parallelWorkflow: Workflow = {
  id: 'wf_parallel_001',
  name: 'Parallel Processing Workflow',
  description: 'A workflow with multiple parallel branches that merge',
  version: '2.1.0',
  status: 'active',
  icon: '⚡',
  tags: ['parallel', 'concurrent', 'advanced'],
  nodes: [
    {
      id: 'nd_trigger_001',
      label: 'Data Received',
      position: { x: 100, y: 200, z: 0 },
      config: { type: 'trigger', event: 'data_received' },
      disabled: false,
      output: ['out1'],
    },
    {
      id: 'nd_split_001',
      label: 'Split Data',
      position: { x: 300, y: 200, z: 0 },
      config: { type: 'split' },
      disabled: false,
      input: ['in1'],
      output: ['out1', 'out2', 'out3'],
    },
    {
      id: 'nd_task_a_001',
      label: 'Task A - Validate',
      position: { x: 500, y: 50, z: 0 },
      config: { type: 'validation', schema: 'user_schema' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_task_b_001',
      label: 'Task B - Transform',
      position: { x: 500, y: 200, z: 0 },
      config: { type: 'transform', operation: 'normalize' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_task_c_001',
      label: 'Task C - Enrich',
      position: { x: 500, y: 350, z: 0 },
      config: { type: 'enrichment', source: 'api' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_aggregate_001',
      label: 'Aggregate Results',
      position: { x: 700, y: 200, z: 0 },
      config: { type: 'aggregate', strategy: 'merge' },
      disabled: false,
      input: ['in1', 'in2', 'in3'],
      output: ['out1'],
    },
    {
      id: 'nd_save_001',
      label: 'Save to Database',
      position: { x: 900, y: 200, z: 0 },
      config: { type: 'database', operation: 'insert', table: 'processed_data' },
      disabled: false,
      input: ['in1'],
    },
  ],
  edges: [
    {
      id: 'ed_009_010',
      source: 'nd_trigger_001:out1',
      target: 'nd_split_001:in1',
    },
    {
      id: 'ed_010_011',
      source: 'nd_split_001:out1',
      target: 'nd_task_a_001:in1',
      label: 'chunk 1',
    },
    {
      id: 'ed_010_012',
      source: 'nd_split_001:out2',
      target: 'nd_task_b_001:in1',
      label: 'chunk 2',
    },
    {
      id: 'ed_010_013',
      source: 'nd_split_001:out3',
      target: 'nd_task_c_001:in1',
      label: 'chunk 3',
    },
    {
      id: 'ed_011_014',
      source: 'nd_task_a_001:out1',
      target: 'nd_aggregate_001:in1',
    },
    {
      id: 'ed_012_014',
      source: 'nd_task_b_001:out1',
      target: 'nd_aggregate_001:in2',
    },
    {
      id: 'ed_013_014',
      source: 'nd_task_c_001:out1',
      target: 'nd_aggregate_001:in3',
    },
    {
      id: 'ed_014_015',
      source: 'nd_aggregate_001:out1',
      target: 'nd_save_001:in1',
    },
  ],
};

/**
 * Workflow with disabled node - useful for testing disabled states
 */
export const workflowWithDisabledNode: Workflow = {
  id: 'wf_disabled_001',
  name: 'Workflow with Disabled Step',
  description: 'A workflow demonstrating disabled node functionality',
  version: '1.0.0',
  status: 'paused',
  icon: '⏸️',
  tags: ['testing', 'disabled'],
  nodes: [
    {
      id: 'nd_start_003',
      label: 'Start',
      position: { x: 100, y: 100, z: 0 },
      disabled: false,
      output: ['out1'],
    },
    {
      id: 'nd_disabled_001',
      label: 'Disabled Step',
      position: { x: 300, y: 100, z: 0 },
      notes: 'This step is currently disabled for testing',
      disabled: true,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_end_003',
      label: 'End',
      position: { x: 500, y: 100, z: 0 },
      disabled: false,
      input: ['in1'],
    },
  ],
  edges: [
    {
      id: 'ed_016_017',
      source: 'nd_start_003:out1',
      target: 'nd_disabled_001:in1',
    },
    {
      id: 'ed_017_018',
      source: 'nd_disabled_001:out1',
      target: 'nd_end_003:in1',
    },
  ],
};

/**
 * API Integration workflow - realistic example
 */
export const apiIntegrationWorkflow: Workflow = {
  id: 'wf_api_001',
  name: 'API Data Sync',
  description: 'Fetches data from external API and syncs to database',
  version: '1.2.0',
  status: 'active',
  icon: '🔄',
  tags: ['api', 'integration', 'sync'],
  nodes: [
    {
      id: 'nd_schedule_001',
      label: 'Scheduled Trigger',
      position: { x: 50, y: 150, z: 0 },
      config: { type: 'schedule', cron: '0 */6 * * *' },
      notes: 'Runs every 6 hours',
      disabled: false,
      output: ['out1'],
    },
    {
      id: 'nd_http_001',
      label: 'Fetch from API',
      position: { x: 250, y: 150, z: 0 },
      authenticationId: 'cn_api_auth_001',
      config: {
        type: 'http',
        method: 'GET',
        url: 'https://api.example.com/data',
      },
      disabled: false,
      input: ['in1'],
      output: ['out1', 'error'],
    },
    {
      id: 'nd_validate_001',
      label: 'Validate Response',
      position: { x: 450, y: 100, z: 0 },
      config: { type: 'validation', schema: 'api_response' },
      disabled: false,
      input: ['in1'],
      output: ['out1', 'error'],
    },
    {
      id: 'nd_transform_001',
      label: 'Transform Data',
      position: { x: 650, y: 100, z: 0 },
      config: { type: 'transform', mapping: 'api_to_db' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_db_001',
      label: 'Update Database',
      position: { x: 850, y: 100, z: 0 },
      authenticationId: 'cn_db_auth_001',
      config: { type: 'database', operation: 'upsert', table: 'synced_data' },
      disabled: false,
      input: ['in1'],
      output: ['out1'],
    },
    {
      id: 'nd_error_001',
      label: 'Error Handler',
      position: { x: 650, y: 250, z: 0 },
      config: { type: 'error_handler', action: 'log_and_notify' },
      disabled: false,
      input: ['in1'],
    },
  ],
  edges: [
    {
      id: 'ed_019_020',
      source: 'nd_schedule_001:out1',
      target: 'nd_http_001:in1',
    },
    {
      id: 'ed_020_021',
      source: 'nd_http_001:out1',
      target: 'nd_validate_001:in1',
      label: 'success',
    },
    {
      id: 'ed_020_025',
      source: 'nd_http_001:error',
      target: 'nd_error_001:in1',
      label: 'error',
    },
    {
      id: 'ed_021_022',
      source: 'nd_validate_001:out1',
      target: 'nd_transform_001:in1',
      label: 'valid',
    },
    {
      id: 'ed_021_025',
      source: 'nd_validate_001:error',
      target: 'nd_error_001:in1',
      label: 'invalid',
    },
    {
      id: 'ed_022_023',
      source: 'nd_transform_001:out1',
      target: 'nd_db_001:in1',
    },
  ],
};

/**
 * Collection of all mock workflows
 */
export const mockWorkflows = [
  emptyWorkflow,
  simpleWorkflow,
  branchingWorkflow,
  parallelWorkflow,
  workflowWithDisabledNode,
  apiIntegrationWorkflow,
];

/**
 * Get a workflow by ID
 */
export function getWorkflowById(id: string): Workflow | undefined {
  return mockWorkflows.find((workflow) => workflow.id === id);
}

/**
 * Get workflows by status
 */
export function getWorkflowsByStatus(status: Workflow['status']): Workflow[] {
  return mockWorkflows.filter((workflow) => workflow.status === status);
}

/**
 * Get workflows by tag
 */
export function getWorkflowsByTag(tag: string): Workflow[] {
  return mockWorkflows.filter((workflow) => workflow.tags?.includes(tag));
}

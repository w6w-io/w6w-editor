/**
 * Mock node data for testing and stories
 * These nodes conform to the node schema from @w6w-io/schema
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

/**
 * Basic trigger node
 */
export const triggerNode: Node = {
  id: 'nd_trigger_mock_001',
  label: 'Webhook Trigger',
  position: { x: 100, y: 100, z: 0 },
  config: {
    type: 'webhook',
    path: '/api/webhook',
    method: 'POST',
  },
  disabled: false,
  output: ['out1'],
};

/**
 * HTTP request node with authentication
 */
export const httpNode: Node = {
  id: 'nd_http_mock_001',
  label: 'HTTP Request',
  authenticationId: 'cn_auth_001',
  position: { x: 300, y: 100, z: 0 },
  config: {
    type: 'http',
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: {
      'Content-Type': 'application/json',
    },
  },
  notes: 'Fetches data from external API',
  disabled: false,
  input: ['in1'],
  output: ['success', 'error'],
};

/**
 * Data transformation node
 */
export const transformNode: Node = {
  id: 'nd_transform_mock_001',
  label: 'Transform Data',
  position: { x: 500, y: 100, z: 0 },
  config: {
    type: 'transform',
    operation: 'map',
    mapping: {
      name: '$.user.fullName',
      email: '$.user.email',
      id: '$.user.userId',
    },
  },
  disabled: false,
  input: ['in1'],
  output: ['out1'],
};

/**
 * Conditional/decision node
 */
export const conditionNode: Node = {
  id: 'nd_condition_mock_001',
  label: 'Check Value',
  position: { x: 300, y: 200, z: 0 },
  config: {
    type: 'condition',
    conditions: [
      {
        field: 'amount',
        operator: 'greater_than',
        value: 1000,
      },
    ],
  },
  disabled: false,
  input: ['in1'],
  output: ['true', 'false'],
};

/**
 * Database operation node
 */
export const databaseNode: Node = {
  id: 'nd_db_mock_001',
  label: 'Save to Database',
  authenticationId: 'cn_db_001',
  position: { x: 700, y: 100, z: 0 },
  config: {
    type: 'database',
    operation: 'insert',
    table: 'users',
    columns: ['name', 'email', 'created_at'],
  },
  disabled: false,
  input: ['in1'],
  output: ['success', 'error'],
};

/**
 * Email notification node
 */
export const emailNode: Node = {
  id: 'nd_email_mock_001',
  label: 'Send Email',
  authenticationId: 'cn_smtp_001',
  position: { x: 500, y: 200, z: 0 },
  config: {
    type: 'email',
    to: '{{user.email}}',
    subject: 'Welcome to our platform',
    template: 'welcome_email',
  },
  disabled: false,
  input: ['in1'],
  output: ['sent', 'failed'],
};

/**
 * Delay/wait node
 */
export const delayNode: Node = {
  id: 'nd_delay_mock_001',
  label: 'Wait 5 Minutes',
  position: { x: 300, y: 300, z: 0 },
  config: {
    type: 'delay',
    duration: 300,
    unit: 'seconds',
  },
  disabled: false,
  input: ['in1'],
  output: ['out1'],
};

/**
 * Aggregation/merge node
 */
export const mergeNode: Node = {
  id: 'nd_merge_mock_001',
  label: 'Merge Results',
  position: { x: 700, y: 200, z: 0 },
  config: {
    type: 'merge',
    strategy: 'combine',
  },
  disabled: false,
  input: ['in1', 'in2', 'in3'],
  output: ['out1'],
};

/**
 * Split/broadcast node
 */
export const splitNode: Node = {
  id: 'nd_split_mock_001',
  label: 'Split Data',
  position: { x: 200, y: 200, z: 0 },
  config: {
    type: 'split',
    strategy: 'broadcast',
  },
  disabled: false,
  input: ['in1'],
  output: ['out1', 'out2', 'out3'],
};

/**
 * Code execution node
 */
export const codeNode: Node = {
  id: 'nd_code_mock_001',
  label: 'Custom Code',
  position: { x: 400, y: 300, z: 0 },
  config: {
    type: 'code',
    language: 'javascript',
    code: 'return { result: input.value * 2 };',
  },
  notes: 'Executes custom JavaScript code',
  disabled: false,
  input: ['in1'],
  output: ['out1', 'error'],
};

/**
 * Filter node
 */
export const filterNode: Node = {
  id: 'nd_filter_mock_001',
  label: 'Filter Items',
  position: { x: 400, y: 150, z: 0 },
  config: {
    type: 'filter',
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
      },
    ],
  },
  disabled: false,
  input: ['in1'],
  output: ['matched', 'unmatched'],
};

/**
 * Disabled node for testing
 */
export const disabledNode: Node = {
  id: 'nd_disabled_mock_001',
  label: 'Disabled Step',
  position: { x: 300, y: 400, z: 0 },
  config: {
    type: 'placeholder',
  },
  notes: 'This node is currently disabled and will be skipped during execution',
  disabled: true,
  input: ['in1'],
  output: ['out1'],
};

/**
 * Collection of all mock nodes
 */
export const mockNodes: Node[] = [
  triggerNode,
  httpNode,
  transformNode,
  conditionNode,
  databaseNode,
  emailNode,
  delayNode,
  mergeNode,
  splitNode,
  codeNode,
  filterNode,
  disabledNode,
];

/**
 * Get a node by ID
 */
export function getNodeById(id: string): Node | undefined {
  return mockNodes.find((node) => node.id === id);
}

/**
 * Get nodes by type (from config)
 */
export function getNodesByType(type: string): Node[] {
  return mockNodes.filter((node) => node.config?.type === type);
}

/**
 * Get enabled nodes only
 */
export function getEnabledNodes(): Node[] {
  return mockNodes.filter((node) => !node.disabled);
}

/**
 * Get disabled nodes only
 */
export function getDisabledNodes(): Node[] {
  return mockNodes.filter((node) => node.disabled);
}

# Mock Data

This directory contains mock data for testing and Storybook stories. All mocks conform to the schemas defined in `@w6w-io/schema`.

## Available Mocks

### Workflows (`workflows.ts`)

Complete workflow examples including nodes and edges:

- **`emptyWorkflow`** - Empty workflow for testing empty states
- **`simpleWorkflow`** - Basic linear workflow with 3 sequential nodes
- **`branchingWorkflow`** - Workflow with conditional branching
- **`parallelWorkflow`** - Complex workflow with parallel execution paths
- **`workflowWithDisabledNode`** - Demonstrates disabled node functionality
- **`apiIntegrationWorkflow`** - Realistic API integration example

### Nodes (`nodes.ts`)

Individual node examples for different use cases:

- **`triggerNode`** - Webhook trigger
- **`httpNode`** - HTTP request with authentication
- **`transformNode`** - Data transformation
- **`conditionNode`** - Conditional/decision logic
- **`databaseNode`** - Database operations
- **`emailNode`** - Email notifications
- **`delayNode`** - Delay/wait step
- **`mergeNode`** - Merge multiple inputs
- **`splitNode`** - Split/broadcast to multiple outputs
- **`codeNode`** - Custom code execution
- **`filterNode`** - Filter items based on conditions
- **`disabledNode`** - Disabled node for testing

### Edges (`edges.ts`)

Connection examples between nodes:

- **`simpleEdge`** - Basic node connection
- **`edgeWithPorts`** - Connection with specific port handles
- **`successEdge`** / **`errorEdge`** - Success/error paths
- **`trueBranchEdge`** / **`falseBranchEdge`** - Conditional branches
- **`mergeInputEdge1-2`** - Multiple inputs to merge node
- **`splitOutputEdge1-3`** - Multiple outputs from split node
- **`labeledEdge`** - Edge with descriptive label

### Connections (`connections.ts`)

Authentication and connection configurations:

- **`oauthConnection`** - GitHub OAuth 2.0 connection
- **`googleOAuthConnection`** - Google OAuth 2.0 connection
- **`bearerTokenConnection`** - Bearer token authentication
- **`apiKeyConnection`** - API key as bearer token
- **`customHeaderConnection`** - Custom header authentication
- **`customAuthConnection`** - Custom authentication with headers, body, and query params

## Usage

### In Tests

```typescript
import { simpleWorkflow, mockNodes } from '__mocks__';

describe('WorkflowEditor', () => {
  it('renders a workflow', () => {
    render(<WorkflowEditor initialWorkflow={simpleWorkflow} />);
    // assertions...
  });
});
```

### In Storybook Stories

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowEditor } from '../WorkflowEditor';
import { parallelWorkflow } from '__mocks__';

export const ParallelExample: Story = {
  args: {
    initialWorkflow: parallelWorkflow,
  },
};
```

### Utility Functions

Each mock file includes helper functions:

```typescript
import {
  getWorkflowById,
  getWorkflowsByStatus,
  getWorkflowsByTag,
  getNodesByType,
  getEdgesBySource,
  getConnectionsByType,
} from '__mocks__';

// Get specific workflow
const workflow = getWorkflowById('wf_simple_001');

// Get active workflows
const activeWorkflows = getWorkflowsByStatus('active');

// Get all HTTP nodes
const httpNodes = getNodesByType('http');
```

## Adding New Mocks

When adding new mocks:

1. Follow the existing naming conventions (e.g., `mockType`)
2. Ensure data conforms to schemas from `@w6w-io/schema`
3. Use proper ID prefixes: `nd_`, `ed_`, `wf_`, `cn_`
4. Add JSDoc comments describing the mock's purpose
5. Export the new mock in `index.ts`
6. Update this README

## Schema Compliance

All mocks use inline TypeScript types that match the schema definitions from `@w6w-io/schema`. This keeps the package lightweight without importing Zod or the schema package directly.

```typescript
// Types are defined inline in each mock file
type Workflow = {
  id: string;
  name: string;
  description?: string;
  version: string;
  // ... matches workflowSchema from @w6w-io/schema
};
```

The types are structurally compatible with the Zod schemas, ensuring type safety while maintaining a lightweight footprint.

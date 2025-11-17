/**
 * Central export point for all mock data
 *
 * Usage:
 * ```typescript
 * import { mockWorkflows, mockNodes, mockEdges, mockConnections } from '__mocks__';
 *
 * // Or import specific mocks
 * import { simpleWorkflow, triggerNode } from '__mocks__';
 * ```
 */

// Export all workflows
export {
  emptyWorkflow,
  simpleWorkflow,
  branchingWorkflow,
  parallelWorkflow,
  workflowWithDisabledNode,
  apiIntegrationWorkflow,
  mockWorkflows,
  getWorkflowById,
  getWorkflowsByStatus,
  getWorkflowsByTag,
} from './workflows';

// Export all nodes
export {
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
  mockNodes,
  getNodeById,
  getNodesByType,
  getEnabledNodes,
  getDisabledNodes,
} from './nodes';

// Export all edges
export {
  simpleEdge,
  edgeWithPorts,
  successEdge,
  errorEdge,
  trueBranchEdge,
  falseBranchEdge,
  mergeInputEdge1,
  mergeInputEdge2,
  splitOutputEdge1,
  splitOutputEdge2,
  splitOutputEdge3,
  labeledEdge,
  mockEdges,
  getEdgeById,
  getEdgesBySource,
  getEdgesByTarget,
  getLabeledEdges,
} from './edges';

// Export all connections
export {
  oauthConnection,
  googleOAuthConnection,
  bearerTokenConnection,
  apiKeyConnection,
  customHeaderConnection,
  customAuthConnection,
  mockConnections,
  getConnectionById,
  getConnectionsByType,
  getConnectionByName,
} from './connections';

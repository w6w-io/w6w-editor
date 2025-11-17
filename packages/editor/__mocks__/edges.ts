/**
 * Mock edge data for testing and stories
 * These edges conform to the edge schema from @w6w-io/schema
 *
 * Note: Types are defined inline to keep this package lightweight.
 * They match the schema definitions from @w6w-io/schema.
 */

type Edge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

/**
 * Simple edge connecting two nodes
 */
export const simpleEdge: Edge = {
  id: 'ed_simple_001',
  source: 'nd_start_001',
  target: 'nd_end_001',
};

/**
 * Edge with port handles
 */
export const edgeWithPorts: Edge = {
  id: 'ed_ports_001',
  source: 'nd_node_001:out1',
  target: 'nd_node_002:in1',
  label: 'data',
};

/**
 * Edge for success path
 */
export const successEdge: Edge = {
  id: 'ed_success_001',
  source: 'nd_http_001:success',
  target: 'nd_transform_001:in1',
  label: 'success',
};

/**
 * Edge for error path
 */
export const errorEdge: Edge = {
  id: 'ed_error_001',
  source: 'nd_http_001:error',
  target: 'nd_error_handler_001:in1',
  label: 'error',
};

/**
 * Edge for conditional true branch
 */
export const trueBranchEdge: Edge = {
  id: 'ed_true_001',
  source: 'nd_condition_001:true',
  target: 'nd_path_a_001:in1',
  label: 'true',
};

/**
 * Edge for conditional false branch
 */
export const falseBranchEdge: Edge = {
  id: 'ed_false_001',
  source: 'nd_condition_001:false',
  target: 'nd_path_b_001:in1',
  label: 'false',
};

/**
 * Edge connecting to merge node (input 1)
 */
export const mergeInputEdge1: Edge = {
  id: 'ed_merge_in1_001',
  source: 'nd_task_a_001:out1',
  target: 'nd_merge_001:in1',
  label: 'result A',
};

/**
 * Edge connecting to merge node (input 2)
 */
export const mergeInputEdge2: Edge = {
  id: 'ed_merge_in2_001',
  source: 'nd_task_b_001:out1',
  target: 'nd_merge_001:in2',
  label: 'result B',
};

/**
 * Edge from split node (output 1)
 */
export const splitOutputEdge1: Edge = {
  id: 'ed_split_out1_001',
  source: 'nd_split_001:out1',
  target: 'nd_process_a_001:in1',
  label: 'chunk 1',
};

/**
 * Edge from split node (output 2)
 */
export const splitOutputEdge2: Edge = {
  id: 'ed_split_out2_001',
  source: 'nd_split_001:out2',
  target: 'nd_process_b_001:in1',
  label: 'chunk 2',
};

/**
 * Edge from split node (output 3)
 */
export const splitOutputEdge3: Edge = {
  id: 'ed_split_out3_001',
  source: 'nd_split_001:out3',
  target: 'nd_process_c_001:in1',
  label: 'chunk 3',
};

/**
 * Edge with descriptive label
 */
export const labeledEdge: Edge = {
  id: 'ed_labeled_001',
  source: 'nd_fetch_001:out1',
  target: 'nd_save_001:in1',
  label: 'fetched data',
};

/**
 * Collection of all mock edges
 */
export const mockEdges: Edge[] = [
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
];

/**
 * Get an edge by ID
 */
export function getEdgeById(id: string): Edge | undefined {
  return mockEdges.find((edge) => edge.id === id);
}

/**
 * Get edges by source node
 */
export function getEdgesBySource(sourceNodeId: string): Edge[] {
  return mockEdges.filter((edge) => edge.source.startsWith(sourceNodeId));
}

/**
 * Get edges by target node
 */
export function getEdgesByTarget(targetNodeId: string): Edge[] {
  return mockEdges.filter((edge) => edge.target.startsWith(targetNodeId));
}

/**
 * Get edges with labels
 */
export function getLabeledEdges(): Edge[] {
  return mockEdges.filter((edge) => edge.label !== undefined);
}

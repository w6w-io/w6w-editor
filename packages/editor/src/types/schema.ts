/**
 * TypeScript interfaces that match @w6w/schema types
 *
 * These are explicit type definitions that match the Zod schema structure.
 * We use these instead of z.infer because the schema uses .extend() and
 * recursive references which cause TypeScript to infer `any`.
 *
 * These types should be kept in sync with the schema package.
 */

/**
 * Node type enum values
 */
export type NodeType = 'trigger' | 'action' | 'transform' | 'condition' | 'loop';

/**
 * Position as an array [x, y] or [x, y, z]
 */
export type Position = [number, number] | [number, number, number];

/**
 * Node in a workflow
 */
export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  label?: string;
  package?: string;
  app?: string;
  version?: string;
  action?: string;
  config?: Record<string, unknown>;
  disabled?: boolean;
  notes?: string;
  input?: string[];
  output?: string[];
  authenticationId?: string;
  metadata?: Record<string, unknown>;
  properties?: unknown[];
}

/**
 * Edge connecting two nodes
 * source/target can include port handles: "nodeId:portName"
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Variable in a workflow
 */
export interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: unknown;
  description?: string;
}

/**
 * Workflow containing nodes and edges
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  icon?: string;
  tags?: string[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: Node[];
  edges: Edge[];
  vars?: Record<string, Variable>;
}

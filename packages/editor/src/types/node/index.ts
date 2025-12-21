/**
 * Node type exports
 *
 * This module provides all node-related types for the workflow editor.
 */

// Base types (standalone, schema-compatible)
export type { SchemaNodeFields, EditorNodeFields, NodeType } from './base';
export { NODE_TYPES } from './base';

// Coupled types (combined for editor use)
export type { WorkflowNodeData, WorkflowNodeType } from './coupled';
export { isValidNodeType, getNodeType } from './coupled';

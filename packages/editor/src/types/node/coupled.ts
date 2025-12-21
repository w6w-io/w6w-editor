/**
 * Coupled type definitions for workflow nodes
 *
 * This module combines schema-compatible fields with editor-specific UI fields
 * to create the final WorkflowNodeData type used throughout the editor.
 */

import type { Node as XYFlowNode } from '@xyflow/react';
import type { SchemaNodeFields, EditorNodeFields, NodeType } from './base';
import { NODE_TYPES } from './base';

// Re-export base types for convenience
export type { SchemaNodeFields, EditorNodeFields, NodeType };
export { NODE_TYPES };

/**
 * WorkflowNodeData - Combined type for node data in the editor
 *
 * This type combines:
 * 1. Schema-compatible fields (can be serialized to match @w6w-io/schema Node)
 * 2. Editor-specific UI fields (callbacks, icons, state)
 *
 * The 'nodeType' field is a legacy alias for the schema's 'type' field,
 * kept for backward compatibility with existing code.
 */
export interface WorkflowNodeData extends SchemaNodeFields, EditorNodeFields {
  /**
   * Node type for editor internal use
   * Maps to schema's `type` field during transform
   *
   * @deprecated Prefer using `type` field for consistency with schema.
   * This field is kept for backward compatibility.
   */
  nodeType?: NodeType;

  /**
   * Allow additional properties for extensibility
   * This preserves backward compatibility with existing code that may
   * add custom properties to node data.
   */
  [key: string]: unknown;
}

/**
 * WorkflowNodeType - React Flow node type for workflow nodes
 *
 * This is the complete node type including position, id, and data,
 * compatible with @xyflow/react's Node type.
 */
export type WorkflowNodeType = XYFlowNode<WorkflowNodeData, 'workflow'>;

/**
 * Type guard to check if a value is a valid NodeType
 *
 * @param value - The value to check
 * @returns True if the value is a valid NodeType
 *
 * @example
 * ```typescript
 * const nodeType: unknown = 'action';
 * if (isValidNodeType(nodeType)) {
 *   // nodeType is now typed as NodeType
 *   console.log(nodeType); // 'action'
 * }
 * ```
 */
export function isValidNodeType(value: unknown): value is NodeType {
  return (
    typeof value === 'string' &&
    (NODE_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Get the effective node type from WorkflowNodeData
 *
 * Handles the legacy `nodeType` field and the schema-aligned `type` field,
 * returning the first valid value found.
 *
 * @param data - The workflow node data
 * @returns The node type if valid, undefined otherwise
 */
export function getNodeType(data: WorkflowNodeData): NodeType | undefined {
  // Prefer `type` over legacy `nodeType`
  if (isValidNodeType(data.type)) {
    return data.type;
  }
  if (isValidNodeType(data.nodeType)) {
    return data.nodeType;
  }
  return undefined;
}

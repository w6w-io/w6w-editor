/**
 * Base type definitions for workflow nodes
 *
 * These types are designed to be compatible with @w6w-io/schema's Node type
 * but work standalone without requiring the schema package.
 */

import type { ReactNode } from 'react';

/**
 * Core node types - matches schema's nodeTypeEnum values
 * This is the standalone definition for when schema is not available
 */
export const NODE_TYPES = [
  'trigger',
  'action',
  'transform',
  'condition',
  'loop',
] as const;

/**
 * Node type union derived from NODE_TYPES const array
 */
export type NodeType = (typeof NODE_TYPES)[number];

/**
 * Base schema-compatible fields for node data
 * These match the schema package's Node type structure
 */
export interface SchemaNodeFields {
  /**
   * Node type from schema's nodeTypeEnum
   * e.g., 'trigger', 'action', 'transform', 'condition', 'loop'
   */
  type?: NodeType;

  /**
   * Package identifier containing this node's action
   */
  package?: string;

  /**
   * App identifier within the package
   */
  app?: string;

  /**
   * Version of the app/package
   */
  version?: string;

  /**
   * Action identifier within the package
   */
  action?: string;

  /**
   * Display label shown in the editor
   */
  label?: string;

  /**
   * Node-specific configuration set by the user
   */
  config?: Record<string, unknown>;

  /**
   * Whether this node is disabled in execution
   */
  disabled?: boolean;

  /**
   * User notes for this node (max 1000 characters in schema)
   */
  notes?: string;

  /**
   * Input ports/handles for receiving data
   */
  input?: string[];

  /**
   * Output ports/handles for sending data
   */
  output?: string[];

  /**
   * ID for the connection used to authenticate this request
   */
  authenticationId?: string;

  /**
   * Additional metadata for the node
   */
  metadata?: Record<string, unknown>;
}

/**
 * UI-specific fields that are only used in the editor
 * These do NOT exist in the schema and are for rendering/interaction only
 */
export interface EditorNodeFields {
  /**
   * Display name for the app (UI-only)
   */
  appName?: string;

  /**
   * Icon for the app - can be a ReactNode or icon identifier string (UI-only)
   */
  appIcon?: ReactNode | string;

  /**
   * Display version for the app (UI-only, may differ from schema version)
   */
  appVersion?: string;

  /**
   * Callback when user requests to delete this node
   */
  onDelete?: (nodeId: string) => void;

  /**
   * Callback when user requests to edit this node
   */
  onEdit?: (nodeId: string) => void;

  /**
   * Callback when user requests to duplicate this node
   */
  onDuplicate?: (nodeId: string) => void;

  /**
   * Callback when user requests to add a node connected to this one
   */
  onAddNode?: (
    nodeId: string,
    handleType: 'source' | 'target',
    handleId?: string
  ) => void;

  /**
   * Whether this node has an incoming connection (UI state)
   */
  hasInputConnection?: boolean;

  /**
   * Whether this node has an outgoing connection (UI state)
   */
  hasOutputConnection?: boolean;
}

/**
 * Core types for the W6W workflow editor
 */

export interface Node {
  id: string;
  type?: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Pending connection state for drag-to-add node functionality
 */
export interface PendingConnection {
  sourceNodeId: string;
  sourceHandle?: string;
  position: { x: number; y: number };
}

/**
 * Edge validation options
 */
export interface EdgeValidation {
  /**
   * Allow nodes to connect to themselves
   * @default false
   */
  allowSelfConnections?: boolean;
  /**
   * Allow duplicate edges between the same nodes
   * @default false
   */
  allowDuplicates?: boolean;
  /**
   * Custom validator function for edge creation
   * Return false to prevent the connection
   */
  customValidator?: (params: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }, nodes: Node[], edges: Edge[]) => boolean;
}

/**
 * Context menu callback handlers
 */
export interface ContextMenuCallbacks {
  /**
   * Called when user requests to add a node at a specific position
   */
  onAddNodeRequest?: (position: { x: number; y: number }) => void;
  /**
   * Called when user requests to edit a node
   */
  onNodeEdit?: (nodeId: string) => void;
  /**
   * Called when user requests to duplicate a node
   */
  onNodeDuplicate?: (nodeId: string) => void;
  /**
   * Called when user requests to delete a node
   */
  onNodeDelete?: (nodeId: string) => void;
  /**
   * Called when a connection is dropped without connecting to an existing node
   * This allows the web app to show an "Add Node" modal and then create the node and edge
   */
  onConnectionDropped?: (params: {
    position: { x: number; y: number };
    sourceNodeId: string;
    sourceHandle?: string;
  }) => void;
  /**
   * Called when an edge is successfully created
   */
  onEdgeCreated?: (params: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }) => void;
  /**
   * Edge validation options
   */
  edgeValidation?: EdgeValidation;
}

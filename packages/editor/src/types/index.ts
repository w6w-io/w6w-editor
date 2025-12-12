/**
 * Core types for the W6W workflow editor
 */

export interface Node {
  id: string;
  type: string;
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
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  nodes: Node[];
  edges: Edge[];
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
}

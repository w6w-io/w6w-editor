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

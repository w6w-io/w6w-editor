import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export interface UseWorkflowHistoryReturn {
  /** Current nodes state */
  nodes: Node[];
  /** Current edges state */
  edges: Edge[];
  /** Set nodes with history tracking */
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  /** Set edges with history tracking */
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  /** Set nodes without recording to history (for drag operations) */
  setNodesWithoutHistory: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  /** Set edges without recording to history */
  setEdgesWithoutHistory: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  /** Batch update nodes and edges as single history entry */
  updateWorkflow: (nodes: Node[], edges: Edge[]) => void;
  /** Manually push current state to history (for drag end) */
  takeSnapshot: () => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Reset history with new initial state */
  resetHistory: (initialState: HistoryState) => void;
}

/**
 * Hook to manage workflow state with undo/redo history
 */
export function useWorkflowHistory(
  initialNodes: Node[],
  initialEdges: Edge[],
  maxHistorySize: number = 50
): UseWorkflowHistoryReturn {
  // Current state
  const [nodes, setNodesInternal] = useState<Node[]>(initialNodes);
  const [edges, setEdgesInternal] = useState<Edge[]>(initialEdges);

  // History stacks
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Ref to track current state for history (avoids stale closures)
  const currentStateRef = useRef<HistoryState>({ nodes: initialNodes, edges: initialEdges });

  // Update ref when state changes
  currentStateRef.current = { nodes, edges };

  // Push current state to history
  const pushToHistory = useCallback(() => {
    const currentState = currentStateRef.current;
    setPast(prev => {
      const newPast = [...prev, { nodes: currentState.nodes, edges: currentState.edges }];
      // Limit history size
      if (newPast.length > maxHistorySize) {
        return newPast.slice(-maxHistorySize);
      }
      return newPast;
    });
    // Clear future when new action is taken
    setFuture([]);
  }, [maxHistorySize]);

  // Take a snapshot of current state (for drag end)
  const takeSnapshot = useCallback(() => {
    pushToHistory();
  }, [pushToHistory]);

  // Set nodes with history tracking
  const setNodes = useCallback((update: Node[] | ((prev: Node[]) => Node[])) => {
    pushToHistory();
    setNodesInternal(update);
  }, [pushToHistory]);

  // Set edges with history tracking
  const setEdges = useCallback((update: Edge[] | ((prev: Edge[]) => Edge[])) => {
    pushToHistory();
    setEdgesInternal(update);
  }, [pushToHistory]);

  // Set nodes without history (for continuous updates like dragging)
  const setNodesWithoutHistory = useCallback((update: Node[] | ((prev: Node[]) => Node[])) => {
    setNodesInternal(update);
  }, []);

  // Set edges without history
  const setEdgesWithoutHistory = useCallback((update: Edge[] | ((prev: Edge[]) => Edge[])) => {
    setEdgesInternal(update);
  }, []);

  // Batch update for single history entry
  const updateWorkflow = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    pushToHistory();
    setNodesInternal(newNodes);
    setEdgesInternal(newEdges);
  }, [pushToHistory]);

  // Undo
  const undo = useCallback(() => {
    setPast(currentPast => {
      if (currentPast.length === 0) return currentPast;

      const previousState = currentPast[currentPast.length - 1];
      if (!previousState) return currentPast;

      const newPast = currentPast.slice(0, -1);

      // Save current state to future
      setFuture(prev => [...prev, currentStateRef.current]);

      // Restore previous state
      setNodesInternal(previousState.nodes);
      setEdgesInternal(previousState.edges);

      return newPast;
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setFuture(currentFuture => {
      if (currentFuture.length === 0) return currentFuture;

      const nextState = currentFuture[currentFuture.length - 1];
      if (!nextState) return currentFuture;

      const newFuture = currentFuture.slice(0, -1);

      // Save current state to past
      setPast(prev => [...prev, currentStateRef.current]);

      // Restore next state
      setNodesInternal(nextState.nodes);
      setEdgesInternal(nextState.edges);

      return newFuture;
    });
  }, []);

  // Reset history
  const resetHistory = useCallback((initialState: HistoryState) => {
    setNodesInternal(initialState.nodes);
    setEdgesInternal(initialState.edges);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesWithoutHistory,
    setEdgesWithoutHistory,
    updateWorkflow,
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    resetHistory,
  };
}

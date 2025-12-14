import { useCallback, useState, forwardRef, useImperativeHandle, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  useViewport,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
  Panel,
  type NodeTypes,
  type Node,
  type Edge,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Workflow, ContextMenuCallbacks, PendingConnection } from '../types';
import { WorkflowNode } from './nodes/WorkflowNode';
import { ContextMenu, type ContextMenuItem } from './ui/ContextMenu';
import { useWorkflowHistory } from '../hooks/useWorkflowHistory';
import '../styles.css';

/**
 * Handle interface for WorkflowEditor component to expose imperative methods
 */
export interface WorkflowEditorHandle {
  /**
   * Complete a pending connection by creating a new node and edge
   */
  completePendingConnection: (nodeId: string, nodeType: string, nodeData: Record<string, unknown>) => void;
  /**
   * Cancel the pending connection without creating a node
   */
  cancelPendingConnection: () => void;
  /**
   * Get the current pending connection state
   */
  getPendingConnection: () => PendingConnection | null;
  /**
   * Get the current workflow state (nodes and edges with current positions)
   */
  getWorkflow: () => Workflow;
  /**
   * Auto-arrange nodes in a horizontal layout
   */
  autoArrange: () => void;
  /**
   * Add a new node at the specified position
   */
  addNode: (nodeId: string, nodeType: string, position: { x: number; y: number }, nodeData: Record<string, unknown>) => void;
  /**
   * Add a new node and connect it to an existing node
   */
  addNodeWithEdge: (
    nodeId: string,
    nodeType: string,
    position: { x: number; y: number },
    nodeData: Record<string, unknown>,
    connection: { sourceNodeId: string; sourceHandle?: string } | { targetNodeId: string; targetHandle?: string }
  ) => void;
  /**
   * Undo the last action
   */
  undo: () => void;
  /**
   * Redo the last undone action
   */
  redo: () => void;
  /**
   * Whether undo is available
   */
  canUndo: boolean;
  /**
   * Whether redo is available
   */
  canRedo: boolean;
}

export interface WorkflowEditorProps extends ContextMenuCallbacks {
  initialWorkflow?: Workflow;
  onChange?: (workflow: Workflow) => void;
  className?: string;
  /**
   * Height of the editor canvas
   * @default '600px'
   */
  height?: string;
  /**
   * Whether to show the minimap
   * @default true
   */
  showMiniMap?: boolean;
  /**
   * Whether to show the controls
   * @default true
   */
  showControls?: boolean;
  /**
   * Whether to show the background grid
   * @default true
   */
  showBackground?: boolean;
  /**
   * Color mode for the editor canvas
   * @default 'light'
   */
  colorMode?: 'light' | 'dark' | 'system';
  /**
   * Callback when a node is deleted
   */
  onNodeDelete?: (nodeId: string) => void;
  /**
   * Callback when a node is edited
   */
  onNodeEdit?: (nodeId: string) => void;
  /**
   * Callback when a node is duplicated
   */
  onNodeDuplicate?: (nodeId: string) => void;
  /**
   * Callback when user requests to add a node (via context menu)
   */
  onAddNodeRequest?: (position: { x: number; y: number }) => void;
  /**
   * Callback when user clicks the "+" button on a node handle to add a connected node
   */
  onAddNodeFromHandle?: (nodeId: string, handleType: 'source' | 'target', handleId?: string) => void;
  /**
   * Callback when user triggers save (Cmd+S / Ctrl+S)
   * The callback receives the current workflow state
   */
  onSave?: (workflow: Workflow) => void;
}

// Define custom node types outside component to prevent re-renders
const nodeTypes: NodeTypes = {
  workflow: WorkflowNode,
};

/**
 * Internal WorkflowEditor component that uses React Flow hooks
 */
const WorkflowEditorInner = forwardRef<WorkflowEditorHandle, WorkflowEditorProps>(({
  initialWorkflow = { nodes: [], edges: [] },
  onChange,
  className = '',
  height = '600px',
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  colorMode = 'light',
  onConnectionDropped,
  onNodeDelete,
  onNodeEdit,
  onNodeDuplicate,
  onAddNodeRequest,
  onAddNodeFromHandle,
  onSave,
}, ref) => {
  const isDark = colorMode === 'dark' || (colorMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Story 03: Track modifier key state for pan/zoom mode
  const [isModifierPressed, setIsModifierPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Story 05: Track interaction state to prevent mid-interaction mode changes
  const [isInteracting, setIsInteracting] = useState(false);
  const lockedModifierStateRef = useRef(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // Use history hook for undo/redo support
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesWithoutHistory,
    updateWorkflow,
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkflowHistory(initialWorkflow.nodes as Node[], initialWorkflow.edges as Edge[]);

  // Track if we're in the middle of a drag operation
  const isDraggingRef = useRef(false);

  // Handle node changes from React Flow (positions, selections, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const hasDragStart = changes.some(c => c.type === 'position' && 'dragging' in c && c.dragging === true);
    const hasDragEnd = changes.some(c => c.type === 'position' && 'dragging' in c && c.dragging === false);

    // Starting a drag - take snapshot before changes
    if (hasDragStart && !isDraggingRef.current) {
      isDraggingRef.current = true;
      takeSnapshot();
    }

    // Apply changes without recording to history (we already took snapshot)
    setNodesWithoutHistory(prev => applyNodeChanges(changes, prev));

    // Drag ended
    if (hasDragEnd) {
      isDraggingRef.current = false;
    }
  }, [takeSnapshot, setNodesWithoutHistory]);

  // Handle edge changes from React Flow
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    // For edge removals, we want to record history
    const hasRemoval = changes.some(c => c.type === 'remove');
    if (hasRemoval) {
      setEdges(prev => applyEdgeChanges(changes, prev));
    } else {
      // For selections and other non-destructive changes, don't record
      setEdges(prev => applyEdgeChanges(changes, prev));
    }
  }, [setEdges]);

  // Calculate which nodes have input/output connections
  const nodeConnectionStatus = useMemo(() => {
    const status: Record<string, { hasInput: boolean; hasOutput: boolean }> = {};
    for (const node of nodes) {
      status[node.id] = { hasInput: false, hasOutput: false };
    }
    for (const edge of edges) {
      const sourceStatus = status[edge.source];
      const targetStatus = status[edge.target];
      if (sourceStatus) {
        sourceStatus.hasOutput = true;
      }
      if (targetStatus) {
        targetStatus.hasInput = true;
      }
    }
    return status;
  }, [nodes, edges]);

  // Internal delete handler that actually removes the node
  const handleInternalDelete = useCallback((nodeId: string) => {
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    // Use updateWorkflow to record both changes as single history entry
    updateWorkflow(newNodes, newEdges);
    onChange?.({ nodes: newNodes, edges: newEdges });
    onNodeDelete?.(nodeId);
  }, [nodes, edges, updateWorkflow, onChange, onNodeDelete]);

  // Enrich nodes with callbacks and connection status
  const enrichedNodes = useMemo(() => {
    return nodes.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: handleInternalDelete,
        onEdit: onNodeEdit,
        onDuplicate: onNodeDuplicate,
        onAddNode: onAddNodeFromHandle,
        hasInputConnection: nodeConnectionStatus[node.id]?.hasInput ?? false,
        hasOutputConnection: nodeConnectionStatus[node.id]?.hasOutput ?? false,
      },
    }));
  }, [nodes, nodeConnectionStatus, handleInternalDelete, onNodeEdit, onNodeDuplicate, onAddNodeFromHandle]);
  const { screenToFlowPosition } = useReactFlow();
  const viewport = useViewport();

  // State for pending connection (when user drags from a handle and drops on canvas)
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onChange?.({ nodes, edges: newEdges });
    },
    [edges, nodes, onChange, setEdges]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      // If connection didn't connect to a target node, handle the dropped connection
      if (!connectionState.toNode) {
        const targetIsPane = (event.target as Element)?.classList.contains('react-flow__pane');

        if (targetIsPane) {
          // Get the position where the connection ended
          const clientX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : event.clientX;
          const clientY = 'changedTouches' in event ? event.changedTouches[0]?.clientY : event.clientY;

          if (clientX === undefined || clientY === undefined) return;

          const position = screenToFlowPosition({ x: clientX, y: clientY });

          // If callback is provided, call it and store pending connection state
          if (onConnectionDropped && connectionState.fromNode) {
            const pendingConn: PendingConnection = {
              position,
              sourceNodeId: connectionState.fromNode.id,
              sourceHandle: connectionState.fromHandle?.id,
            };
            setPendingConnection(pendingConn);
            onConnectionDropped(pendingConn);
          } else {
            // Fallback: create node directly for standalone usage
            const newNode: Node = {
              id: `node-${Date.now()}`,
              type: 'workflow',
              position,
              data: { label: 'New Node' },
            };

            const newNodes = [...nodes, newNode];
            setNodes(newNodes);

            // Create edge from source to new node
            if (connectionState.fromNode) {
              const newEdge = {
                id: `e${connectionState.fromNode.id}-${newNode.id}`,
                source: connectionState.fromNode.id,
                target: newNode.id,
                sourceHandle: connectionState.fromHandle?.id || null,
              };
              const newEdges = [...edges, newEdge];
              setEdges(newEdges);
              onChange?.({ nodes: newNodes, edges: newEdges });
            } else {
              onChange?.({ nodes: newNodes, edges });
            }
          }
        }
      }
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges, onChange, onConnectionDropped]
  );

  // Context menu handlers
  const onPaneContextMenu = useCallback((event: any) => {
    event.preventDefault();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    const menuItems: ContextMenuItem[] = [];

    if (onAddNodeRequest) {
      menuItems.push({
        label: 'Add Node',
        onClick: () => {
          onAddNodeRequest(position);
          setContextMenu(null);
        },
      });
    }

    if (menuItems.length > 0) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        items: menuItems,
      });
    }
  }, [screenToFlowPosition, onAddNodeRequest]);

  const onNodeContextMenu = useCallback((event: any, node: Node) => {
    event.preventDefault();
    const menuItems: ContextMenuItem[] = [];

    if (onNodeEdit) {
      menuItems.push({
        label: 'Edit',
        onClick: () => {
          onNodeEdit(node.id);
          setContextMenu(null);
        },
      });
    }

    if (onNodeDuplicate) {
      menuItems.push({
        label: 'Duplicate',
        onClick: () => {
          onNodeDuplicate(node.id);
          setContextMenu(null);
        },
      });
    }

    if (onNodeDelete) {
      menuItems.push({
        label: 'Delete',
        destructive: true,
        onClick: () => {
          // Remove node and its connected edges
          const newNodes = nodes.filter((n) => n.id !== node.id);
          const newEdges = edges.filter(
            (e) => e.source !== node.id && e.target !== node.id
          );
          updateWorkflow(newNodes, newEdges);
          onChange?.({ nodes: newNodes, edges: newEdges });
          onNodeDelete(node.id);
          setContextMenu(null);
        },
      });
    }

    if (menuItems.length > 0) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        items: menuItems,
      });
    }
  }, [nodes, edges, updateWorkflow, onChange, onNodeEdit, onNodeDuplicate, onNodeDelete]);

  const onEdgeContextMenu = useCallback((event: any, edge: Edge) => {
    event.preventDefault();
    const menuItems: ContextMenuItem[] = [
      {
        label: 'Delete Edge',
        destructive: true,
        onClick: () => {
          const newEdges = edges.filter((e) => e.id !== edge.id);
          setEdges(newEdges);
          onChange?.({ nodes, edges: newEdges });
          setContextMenu(null);
        },
      },
    ];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems,
    });
  }, [nodes, edges, setEdges, onChange]);

  // Close context menu when clicking elsewhere
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Story 05: Track selection start to lock mode during interaction
  const onSelectionStart = useCallback(() => {
    setIsInteracting(true);
    lockedModifierStateRef.current = isModifierPressed;
  }, [isModifierPressed]);

  const onSelectionEnd = useCallback(() => {
    setIsInteracting(false);
  }, []);

  // Story 05: Use locked modifier state during interactions
  const effectiveModifierPressed = isInteracting ? lockedModifierStateRef.current : isModifierPressed;

  // Method to complete a pending connection by creating node and edge
  const completePendingConnection = useCallback(
    (nodeId: string, nodeType: string, nodeData: Record<string, unknown>) => {
      if (!pendingConnection) {
        console.warn('No pending connection to complete');
        return;
      }

      // Create the new node at the pending connection position
      // Note: callbacks will be added by enrichedNodes useMemo
      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position: pendingConnection.position,
        data: nodeData,
      };

      const newNodes = [...nodes, newNode];

      // Create edge from source to new node
      const newEdge = {
        id: `e${pendingConnection.sourceNodeId}-${nodeId}`,
        source: pendingConnection.sourceNodeId,
        target: nodeId,
        sourceHandle: pendingConnection.sourceHandle || null,
      };
      const newEdges = [...edges, newEdge];

      // Use updateWorkflow to record both changes as single history entry
      updateWorkflow(newNodes, newEdges);

      // Clear pending connection
      setPendingConnection(null);

      // Notify parent of changes
      onChange?.({ nodes: newNodes, edges: newEdges });
    },
    [pendingConnection, nodes, edges, updateWorkflow, onChange]
  );

  // Method to cancel a pending connection without creating a node
  const cancelPendingConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  // Method to get current pending connection
  const getPendingConnection = useCallback(() => {
    return pendingConnection;
  }, [pendingConnection]);

  // Method to get current workflow state with positions
  const getWorkflow = useCallback((): Workflow => {
    // Return nodes without the enriched callback data, just the core data
    const cleanNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.data?.label,
        nodeType: node.data?.nodeType,
        package: node.data?.package,
        app: node.data?.app,
        action: node.data?.action,
        config: node.data?.config,
        disabled: node.data?.disabled,
        notes: node.data?.notes,
        input: node.data?.input,
        output: node.data?.output,
        packageId: node.data?.packageId,
        actionId: node.data?.actionId,
      },
    }));
    return { nodes: cleanNodes as Node[], edges };
  }, [nodes, edges]);

  // Method to auto-arrange nodes in a horizontal layout
  const autoArrange = useCallback(() => {
    if (nodes.length === 0) return;

    // Build adjacency list from edges
    const outgoing: Record<string, string[]> = {};
    const incoming: Record<string, string[]> = {};
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const edge of edges) {
      const src = outgoing[edge.source];
      if (!src) {
        outgoing[edge.source] = [edge.target];
      } else {
        src.push(edge.target);
      }
      const tgt = incoming[edge.target];
      if (!tgt) {
        incoming[edge.target] = [edge.source];
      } else {
        tgt.push(edge.source);
      }
    }

    // Find root nodes (no incoming edges)
    const roots = nodes.filter(n => {
      const inc = incoming[n.id];
      return !inc || inc.length === 0;
    });

    // BFS to assign levels
    const levels: Record<string, number> = {};
    const queue: { id: string; level: number }[] = roots.map(n => ({ id: n.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels[id] = Math.max(levels[id] ?? 0, level);

      const children = outgoing[id] || [];
      for (const childId of children) {
        if (nodeIds.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }

    // Handle disconnected nodes
    for (const node of nodes) {
      if (levels[node.id] === undefined) {
        levels[node.id] = 0;
      }
    }

    // Group nodes by level
    const levelGroups: Record<number, string[]> = {};
    for (const [id, level] of Object.entries(levels)) {
      const group = levelGroups[level];
      if (!group) {
        levelGroups[level] = [id];
      } else {
        group.push(id);
      }
    }

    // Calculate positions
    const nodeWidth = 150;
    const nodeHeight = 60;
    const horizontalGap = 100;
    const verticalGap = 50;

    const newNodes = nodes.map(node => {
      const level = levels[node.id] ?? 0;
      const nodesAtLevel = levelGroups[level] ?? [node.id];
      const indexAtLevel = nodesAtLevel.indexOf(node.id);

      return {
        ...node,
        position: {
          x: level * (nodeWidth + horizontalGap),
          y: indexAtLevel * (nodeHeight + verticalGap),
        },
      };
    });

    setNodes(newNodes);
    onChange?.({ nodes: newNodes, edges });
  }, [nodes, edges, setNodes, onChange]);

  // Method to add a new node at a specific position
  const addNode = useCallback(
    (nodeId: string, nodeType: string, position: { x: number; y: number }, nodeData: Record<string, unknown>) => {
      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position,
        data: nodeData,
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      onChange?.({ nodes: newNodes, edges });
    },
    [nodes, edges, setNodes, onChange]
  );

  // Method to add a new node with an edge connection
  const addNodeWithEdge = useCallback(
    (
      nodeId: string,
      nodeType: string,
      position: { x: number; y: number },
      nodeData: Record<string, unknown>,
      connection: { sourceNodeId: string; sourceHandle?: string } | { targetNodeId: string; targetHandle?: string }
    ) => {
      console.log('[Editor] addNodeWithEdge called:', { nodeId, nodeType, position, nodeData, connection });

      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position,
        data: nodeData,
      };

      // Create the edge based on connection type
      const isSourceConnection = 'sourceNodeId' in connection;
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: isSourceConnection ? (connection as { sourceNodeId: string }).sourceNodeId : nodeId,
        target: isSourceConnection ? nodeId : (connection as { targetNodeId: string }).targetNodeId,
        sourceHandle: isSourceConnection ? (connection as { sourceNodeId: string; sourceHandle?: string }).sourceHandle : undefined,
        targetHandle: !isSourceConnection ? (connection as { targetNodeId: string; targetHandle?: string }).targetHandle : undefined,
      };

      console.log('[Editor] Creating edge:', newEdge);

      const newNodes = [...nodes, newNode];
      const newEdges = [...edges, newEdge];
      console.log('[Editor] New state - nodes:', newNodes.length, 'edges:', newEdges.length);

      // Use updateWorkflow to record both changes as single history entry
      updateWorkflow(newNodes, newEdges);
      onChange?.({ nodes: newNodes, edges: newEdges });
    },
    [nodes, edges, updateWorkflow, onChange]
  );

  // Story 03: Track modifier key state (Cmd/Ctrl)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        setIsModifierPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) {
        setIsModifierPressed(false);
      }
    };

    // Reset state when window loses focus
    const handleBlur = () => {
      setIsModifierPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Story 03: Prevent browser default Cmd+scroll zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Keyboard shortcuts for save and undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      // Undo: Cmd/Ctrl+Z (without Shift)
      if (isMod && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
      if (isMod && ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
        event.preventDefault();
        redo();
        return;
      }

      // Save: Cmd/Ctrl+S
      if (isMod && event.key === 's') {
        event.preventDefault();
        if (onSave) {
          onSave(getWorkflow());
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, onSave, getWorkflow]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    completePendingConnection,
    cancelPendingConnection,
    getPendingConnection,
    getWorkflow,
    autoArrange,
    addNode,
    addNodeWithEdge,
    undo,
    redo,
    canUndo,
    canRedo,
  }), [completePendingConnection, cancelPendingConnection, getPendingConnection, getWorkflow, autoArrange, addNode, addNodeWithEdge, undo, redo, canUndo, canRedo]);

  return (
    <div
      ref={containerRef}
      className={`w6w-editor ${className} ${isModifierPressed ? 'pan-mode' : 'selection-mode'}`}
      style={{ height, width: '100%', position: 'relative' }}
    >
      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        // Story 01 & 03 & 05: Make drag-to-select default, switch to pan when modifier pressed
        panOnDrag={effectiveModifierPressed}
        selectionOnDrag={!effectiveModifierPressed}
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag={!effectiveModifierPressed}
        selectionKeyCode={null}
        onSelectionStart={onSelectionStart}
        onSelectionEnd={onSelectionEnd}
        // Story 02 & 03 & 05: Change scroll to pan Y-axis, switch to zoom when modifier pressed
        zoomOnScroll={effectiveModifierPressed}
        panOnScroll={!effectiveModifierPressed}
        // Keep zoom on pinch for touch devices
        zoomOnPinch={true}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        colorMode={colorMode}
        proOptions={{ hideAttribution: true }}
      >
        {showBackground && <Background />}
        {showControls && <Controls />}
        {showMiniMap && <MiniMap />}
        <Panel position="top-left">
          <div style={{
            padding: '8px',
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '4px',
            fontSize: '12px',
            color: isDark ? '#e5e7eb' : '#374151'
          }}>
            <strong>W6W Workflow Editor</strong>
          </div>
        </Panel>
        {/* Editor Toolbar */}
        <Panel position="bottom-left" className="editor-toolbar-panel">
          <div className={`editor-toolbar ${isDark ? 'dark' : ''}`}>
            {/* Undo button */}
            <button
              className="editor-toolbar-button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Cmd/Ctrl+Z)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            {/* Redo button */}
            <button
              className="editor-toolbar-button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Cmd/Ctrl+Shift+Z)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
            {/* Separator */}
            <div className="editor-toolbar-separator" />
            {/* Auto-arrange button */}
            <button
              className="editor-toolbar-button"
              onClick={autoArrange}
              title="Auto-arrange nodes"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        </Panel>
      </ReactFlow>
      {pendingConnection && (
        <div
          className="pending-connection-indicator"
          style={{
            left: pendingConnection.position.x * viewport.zoom + viewport.x,
            top: pendingConnection.position.y * viewport.zoom + viewport.y,
          }}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
      {/* Story 04: Visual feedback for pan mode */}
      {isModifierPressed && (
        <div className="mode-indicator">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11V6l5 5-5 5v-5H3M15 12h6M20 7l3 5-3 5" />
          </svg>
          <span className="mode-indicator-text">Pan &amp; Zoom Mode</span>
        </div>
      )}
    </div>
  );
});

WorkflowEditorInner.displayName = 'WorkflowEditorInner';

/**
 * WorkflowEditor - Main visual workflow editor component powered by React Flow
 *
 * @example
 * ```tsx
 * const editorRef = useRef<WorkflowEditorHandle>(null);
 *
 * <WorkflowEditor
 *   ref={editorRef}
 *   initialWorkflow={{ nodes: [], edges: [] }}
 *   onChange={(workflow) => console.log(workflow)}
 *   onConnectionDropped={(params) => {
 *     // Show modal to select node type, then:
 *     editorRef.current?.completePendingConnection('new-id', 'workflow', { label: 'New Node' });
 *   }}
 *   height="800px"
 * />
 * ```
 */
export const WorkflowEditor = forwardRef<WorkflowEditorHandle, WorkflowEditorProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

WorkflowEditor.displayName = 'WorkflowEditor';

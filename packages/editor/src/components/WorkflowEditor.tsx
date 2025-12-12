import { useCallback, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useViewport,
  type Connection,
  Panel,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Workflow, ContextMenuCallbacks, PendingConnection } from '../types';
import { WorkflowNode } from './nodes/WorkflowNode';
import { ContextMenu, type ContextMenuItem } from './ui/ContextMenu';
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
}, ref) => {
  const isDark = colorMode === 'dark' || (colorMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges as Edge[]);

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

  // Enrich nodes with callbacks and connection status
  const enrichedNodes = useMemo(() => {
    return nodes.map((node: Node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: onNodeDelete,
        onEdit: onNodeEdit,
        onDuplicate: onNodeDuplicate,
        onAddNode: onAddNodeFromHandle,
        hasInputConnection: nodeConnectionStatus[node.id]?.hasInput ?? false,
        hasOutputConnection: nodeConnectionStatus[node.id]?.hasOutput ?? false,
      },
    }));
  }, [nodes, nodeConnectionStatus, onNodeDelete, onNodeEdit, onNodeDuplicate, onAddNodeFromHandle]);
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

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      // Notify parent of changes after state update
      setTimeout(() => {
        onChange?.({ nodes, edges });
      }, 0);
    },
    [onNodesChange, onChange, nodes, edges]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      // Notify parent of changes after state update
      setTimeout(() => {
        onChange?.({ nodes, edges });
      }, 0);
    },
    [onEdgesChange, onChange, nodes, edges]
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
          setNodes(newNodes);
          setEdges(newEdges);
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
  }, [nodes, edges, setNodes, setEdges, onChange, onNodeEdit, onNodeDuplicate, onNodeDelete]);

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
      setNodes(newNodes);

      // Create edge from source to new node
      const newEdge = {
        id: `e${pendingConnection.sourceNodeId}-${nodeId}`,
        source: pendingConnection.sourceNodeId,
        target: nodeId,
        sourceHandle: pendingConnection.sourceHandle || null,
      };
      const newEdges = [...edges, newEdge];
      setEdges(newEdges);

      // Clear pending connection
      setPendingConnection(null);

      // Notify parent of changes
      onChange?.({ nodes: newNodes, edges: newEdges });
    },
    [pendingConnection, nodes, edges, setNodes, setEdges, onChange]
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    completePendingConnection,
    cancelPendingConnection,
    getPendingConnection,
    getWorkflow,
    autoArrange,
  }), [completePendingConnection, cancelPendingConnection, getPendingConnection, getWorkflow, autoArrange]);

  return (
    <div className={`w6w-editor ${className}`} style={{ height, width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        selectionKeyCode={null}
        selectNodesOnDrag={false}
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

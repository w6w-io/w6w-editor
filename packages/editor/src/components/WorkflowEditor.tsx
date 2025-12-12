import { useCallback, useState, forwardRef, useImperativeHandle } from 'react';
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
}, ref) => {
  const isDark = colorMode === 'dark' || (colorMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges as Edge[]);
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

  // Method to complete a pending connection by creating node and edge
  const completePendingConnection = useCallback(
    (nodeId: string, nodeType: string, nodeData: Record<string, unknown>) => {
      if (!pendingConnection) {
        console.warn('No pending connection to complete');
        return;
      }

      // Create the new node at the pending connection position
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    completePendingConnection,
    cancelPendingConnection,
    getPendingConnection,
  }), [completePendingConnection, cancelPendingConnection, getPendingConnection]);

  return (
    <div className={`w6w-editor ${className}`} style={{ height, width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
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

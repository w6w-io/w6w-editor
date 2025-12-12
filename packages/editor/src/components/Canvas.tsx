import { useCallback, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ContextMenu, type ContextMenuItem } from './ui/ContextMenu';
import type { ContextMenuCallbacks, PendingConnection } from '../types';
import '../styles.css';

/**
 * Handle interface for Canvas component to expose imperative methods
 */
export interface CanvasHandle {
  /**
   * Complete a pending connection by creating a new node and edge
   * @param nodeId - The ID to assign to the new node
   * @param nodeType - The type of node to create
   * @param nodeData - The data for the new node
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

export interface CanvasProps extends ContextMenuCallbacks {
  /**
   * Initial nodes on the canvas
   */
  initialNodes?: Node[];
  /**
   * Initial edges on the canvas
   */
  initialEdges?: Edge[];
  /**
   * Callback when nodes or edges change
   */
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  /**
   * Height of the canvas
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
   * Whether to show the background
   * @default true
   */
  showBackground?: boolean;
  /**
   * Background pattern variant
   * @default 'dots'
   */
  backgroundVariant?: BackgroundVariant;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Internal Canvas component that uses React Flow hooks
 */
const CanvasInner = forwardRef<CanvasHandle, CanvasProps>(({
  initialNodes = [],
  initialEdges = [],
  onChange,
  height = '600px',
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  backgroundVariant = BackgroundVariant.Dots,
  className = '',
  onAddNodeRequest,
  onNodeEdit,
  onNodeDuplicate,
  onNodeDelete,
  onConnectionDropped,
  onEdgeCreated,
  edgeValidation,
}, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // State for pending connection (when user drags from a handle and drops on canvas)
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  // Handle context menu on pane (canvas background)
  const onPaneContextMenu = useCallback((event: any) => {
    event.preventDefault();

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'Add node',
          onClick: () => {
            // Call callback if provided, otherwise fallback to default behavior
            if (onAddNodeRequest) {
              onAddNodeRequest(position);
            } else {
              // Fallback: create node directly for standalone usage
              const newNode: Node = {
                id: `node-${Date.now()}`,
                type: 'default',
                position,
                data: { label: 'New Node' },
              };
              setNodes((nds) => [...nds, newNode]);
              onChange?.([...nodes, newNode], edges);
            }
          },
        },
      ],
    });
  }, [screenToFlowPosition, setNodes, nodes, edges, onChange, onAddNodeRequest]);

  // Handle context menu on node
  const onNodeContextMenu = useCallback((event: any, node: Node) => {
    event.preventDefault();
    event.stopPropagation();

    // Build context menu items based on available callbacks
    const menuItems: ContextMenuItem[] = [];

    if (onNodeEdit) {
      menuItems.push({
        label: 'Edit',
        onClick: () => onNodeEdit(node.id),
      });
    }

    if (onNodeDuplicate) {
      menuItems.push({
        label: 'Duplicate',
        onClick: () => onNodeDuplicate(node.id),
      });
    }

    // Always show delete option (either callback or default behavior)
    if (onNodeDelete) {
      menuItems.push({
        label: 'Delete',
        destructive: true,
        onClick: () => onNodeDelete(node.id),
      });
    } else {
      // Fallback: delete node directly for standalone usage
      menuItems.push({
        label: 'Delete',
        destructive: true,
        onClick: () => {
          const newNodes = nodes.filter((n) => n.id !== node.id);
          // Remove all edges connected to this node
          const newEdges = edges.filter(
            (e) => e.source !== node.id && e.target !== node.id
          );
          setNodes(newNodes);
          setEdges(newEdges);
          onChange?.(newNodes, newEdges);
        },
      });
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems,
    });
  }, [nodes, edges, setNodes, setEdges, onChange, onNodeEdit, onNodeDuplicate, onNodeDelete]);

  // Handle context menu on edge
  const onEdgeContextMenu = useCallback((event: any, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'Delete edge',
          destructive: true,
          onClick: () => {
            const newEdges = edges.filter((e) => e.id !== edge.id);
            setEdges(newEdges);
            onChange?.(nodes, newEdges);
          },
        },
      ],
    });
  }, [edges, nodes, setEdges, onChange]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent self-connections (unless explicitly allowed)
      if (!edgeValidation?.allowSelfConnections && params.source === params.target) {
        console.warn('Self-connections are not allowed');
        return;
      }

      // Prevent duplicate edges (unless explicitly allowed)
      if (!edgeValidation?.allowDuplicates) {
        const isDuplicate = edges.some(
          (e) =>
            e.source === params.source &&
            e.target === params.target &&
            e.sourceHandle === params.sourceHandle &&
            e.targetHandle === params.targetHandle
        );
        if (isDuplicate) {
          console.warn('Duplicate edge already exists');
          return;
        }
      }

      // Apply custom validation if provided
      if (edgeValidation?.customValidator) {
        const isValid = edgeValidation.customValidator(
          {
            source: params.source || '',
            target: params.target || '',
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
          },
          nodes,
          edges
        );
        if (!isValid) {
          console.warn('Connection rejected by custom validator');
          return;
        }
      }

      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onChange?.(nodes, newEdges);

      // Call onEdgeCreated callback if provided
      if (onEdgeCreated) {
        onEdgeCreated({
          source: params.source || '',
          target: params.target || '',
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        });
      }
    },
    [edges, nodes, onChange, setEdges, onEdgeCreated, edgeValidation]
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
              type: 'default',
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
              onChange?.(newNodes, newEdges);
            } else {
              onChange?.(newNodes, edges);
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
      setTimeout(() => {
        onChange?.(nodes, edges);
      }, 0);
    },
    [onNodesChange, onChange, nodes, edges]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setTimeout(() => {
        onChange?.(nodes, edges);
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
      onChange?.(newNodes, newEdges);
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
    <div ref={containerRef} className={`w6w-canvas ${className}`} style={{ height, width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        panActivationKeyCode="Space"
        proOptions={{ hideAttribution: true }}
      >
        {showBackground && <Background variant={backgroundVariant} />}
        {showControls && <Controls />}
        {showMiniMap && <MiniMap />}
      </ReactFlow>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
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

CanvasInner.displayName = 'CanvasInner';

/**
 * Canvas - A workflow canvas component powered by React Flow
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<CanvasHandle>(null);
 *
 * <Canvas
 *   ref={canvasRef}
 *   initialNodes={[
 *     { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }
 *   ]}
 *   initialEdges={[]}
 *   onChange={(nodes, edges) => console.log(nodes, edges)}
 *   onConnectionDropped={(params) => {
 *     // Show modal to select node type, then:
 *     canvasRef.current?.completePendingConnection('new-id', 'custom', { label: 'New Node' });
 *   }}
 * />
 * ```
 */
export const Canvas = forwardRef<CanvasHandle, CanvasProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

Canvas.displayName = 'Canvas';

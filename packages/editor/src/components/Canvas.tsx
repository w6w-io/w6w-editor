import { type FC, useCallback, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ContextMenu, type ContextMenuItem } from './ui/ContextMenu';
import type { ContextMenuCallbacks } from '../types';

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
const CanvasInner: FC<CanvasProps> = ({
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
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

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
          setNodes(newNodes);
          onChange?.(newNodes, edges);
        },
      });
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems,
    });
  }, [nodes, edges, setNodes, onChange, onNodeEdit, onNodeDuplicate, onNodeDelete]);

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
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onChange?.(nodes, newEdges);
    },
    [edges, nodes, onChange, setEdges]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      // If connection didn't connect to a target node, create a new node
      if (!connectionState.toNode) {
        const targetIsPane = (event.target as Element)?.classList.contains('react-flow__pane');

        if (targetIsPane) {
          // Get the position where the connection ended
          const clientX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : event.clientX;
          const clientY = 'changedTouches' in event ? event.changedTouches[0]?.clientY : event.clientY;

          if (clientX === undefined || clientY === undefined) return;

          const position = screenToFlowPosition({ x: clientX, y: clientY });

          // Create new node at the drop position
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
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges, onChange]
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

  return (
    <div className={`w6w-canvas ${className}`} style={{ height, width: '100%' }}>
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
    </div>
  );
};

/**
 * Canvas - A workflow canvas component powered by React Flow
 *
 * @example
 * ```tsx
 * <Canvas
 *   initialNodes={[
 *     { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }
 *   ]}
 *   initialEdges={[]}
 *   onChange={(nodes, edges) => console.log(nodes, edges)}
 * />
 * ```
 */
export const Canvas: FC<CanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
};

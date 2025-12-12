import { type FC, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  Panel,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Workflow, ContextMenuCallbacks } from '../types';
import { WorkflowNode } from './nodes/WorkflowNode';

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

/**
 * WorkflowEditor - Main visual workflow editor component powered by React Flow
 *
 * @example
 * ```tsx
 * <WorkflowEditor
 *   initialWorkflow={{ nodes: [], edges: [] }}
 *   onChange={(workflow) => console.log(workflow)}
 *   height="800px"
 * />
 * ```
 */
// Define custom node types outside component to prevent re-renders
const nodeTypes: NodeTypes = {
  workflow: WorkflowNode,
};

export const WorkflowEditor: FC<WorkflowEditorProps> = ({
  initialWorkflow = { nodes: [], edges: [] },
  onChange,
  className = '',
  height = '600px',
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  colorMode = 'light',
}) => {
  const isDark = colorMode === 'dark' || (colorMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [nodes, , onNodesChange] = useNodesState(initialWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onChange?.({ nodes, edges: newEdges });
    },
    [edges, nodes, onChange, setEdges]
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

  return (
    <div className={`w6w-editor ${className}`} style={{ height, width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
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
    </div>
  );
};

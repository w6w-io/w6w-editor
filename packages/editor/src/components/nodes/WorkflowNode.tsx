import { type FC, memo, useMemo } from 'react';
import { Handle, Position, type NodeProps as XYNodeProps, type Node } from '@xyflow/react';
import { NodeActionToolbar } from '../ui/NodeActionToolbar';

export type WorkflowNodeData = {
  label?: string;
  nodeType?: string;
  package?: string;
  app?: string;
  action?: string;
  config?: Record<string, unknown>;
  disabled?: boolean;
  notes?: string;
  input?: string[];
  output?: string[];
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onAddNode?: (nodeId: string, handleType: 'source' | 'target', handleId?: string) => void;
  hasInputConnection?: boolean;
  hasOutputConnection?: boolean;
  [key: string]: unknown;
};

export type WorkflowNodeType = Node<WorkflowNodeData, 'workflow'>;

const handleStyle = {
  background: '#555',
  width: '8px',
  height: '8px',
  border: '2px solid #fff',
};

/**
 * WorkflowNode - A custom React Flow node that renders dynamic input/output handles
 * based on the node's data.input and data.output arrays
 */
export const WorkflowNode: FC<XYNodeProps<WorkflowNodeType>> = memo(({ id, data, selected }) => {
  const inputs = data.input || [];
  const outputs = data.output || [];

  // Calculate handle positions for inputs (left side)
  const inputHandles = useMemo(() => {
    if (inputs.length === 0) {
      // Default single input handle
      return [{ id: undefined, top: '50%' }];
    }
    return inputs.map((id, index) => ({
      id,
      top: `${((index + 1) / (inputs.length + 1)) * 100}%`,
    }));
  }, [inputs]);

  // Calculate handle positions for outputs (right side)
  const outputHandles = useMemo(() => {
    if (outputs.length === 0) {
      // Default single output handle
      return [{ id: undefined, top: '50%' }];
    }
    return outputs.map((id, index) => ({
      id,
      top: `${((index + 1) / (outputs.length + 1)) * 100}%`,
    }));
  }, [outputs]);

  // Get background color based on node type
  const getNodeColor = () => {
    switch (data.nodeType) {
      case 'trigger':
        return '#e3f2fd';
      case 'condition':
        return '#fff3e0';
      case 'action':
        return '#e8f5e9';
      case 'transform':
        return '#f3e5f5';
      case 'loop':
        return '#fce4ec';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <div
      className="workflow-node"
      style={{
        position: 'relative',
        padding: '10px 20px',
        borderRadius: '8px',
        background: getNodeColor(),
        border: selected ? '2px solid #1a192b' : '1px solid #ccc',
        minWidth: '120px',
        minHeight: `${Math.max(40, Math.max(inputs.length, outputs.length) * 25)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
        opacity: data.disabled ? 0.5 : 1,
      }}
    >
      {/* Action toolbar (shown when selected) */}
      {selected && (data.onDelete || data.onEdit || data.onDuplicate) && (
        <NodeActionToolbar
          nodeId={id}
          onDelete={data.onDelete}
          onEdit={data.onEdit}
          onDuplicate={data.onDuplicate}
        />
      )}
      {/* Input handles (left side) */}
      {inputHandles.map((handle) => (
        <Handle
          key={handle.id || 'default-input'}
          type="target"
          position={Position.Left}
          id={handle.id}
          style={{
            ...handleStyle,
            top: handle.top,
          }}
        />
      ))}

      {/* Node label */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          textAlign: 'center',
          color: '#333',
        }}
      >
        {data.label || 'Node'}
      </div>

      {/* Output handles (right side) */}
      {outputHandles.map((handle) => (
        <Handle
          key={handle.id || 'default-output'}
          type="source"
          position={Position.Right}
          id={handle.id}
          style={{
            ...handleStyle,
            top: handle.top,
          }}
        />
      ))}

      {/* Add node buttons for unconnected handles */}
      {data.onAddNode && !data.hasInputConnection && (
        <button
          className="add-node-button add-node-button-left"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddNode?.(id, 'target');
          }}
          title="Add node before"
          aria-label="Add node before"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
      {data.onAddNode && !data.hasOutputConnection && (
        <button
          className="add-node-button add-node-button-right"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddNode?.(id, 'source');
          }}
          title="Add node after"
          aria-label="Add node after"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

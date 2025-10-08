import { type FC } from 'react';
import type { Workflow } from '../types';

export interface WorkflowEditorProps {
  initialWorkflow?: Workflow;
  onChange?: (workflow: Workflow) => void;
  className?: string;
}

/**
 * WorkflowEditor - Main visual workflow editor component
 *
 * @example
 * ```tsx
 * <WorkflowEditor
 *   initialWorkflow={{ nodes: [], edges: [] }}
 *   onChange={(workflow) => console.log(workflow)}
 * />
 * ```
 */
export const WorkflowEditor: FC<WorkflowEditorProps> = ({
  initialWorkflow = { nodes: [], edges: [] },
  onChange,
  className = '',
}) => {
  return (
    <div className={`w6w-editor ${className}`}>
      <h1>W6W Workflow Editor</h1>
      <p>Visual workflow editor - Coming soon!</p>
      <pre>{JSON.stringify(initialWorkflow, null, 2)}</pre>
    </div>
  );
};

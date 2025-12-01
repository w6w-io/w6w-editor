/**
 * @w6w/editor - Visual workflow editor component
 * @packageDocumentation
 */

export { WorkflowEditor } from './components/WorkflowEditor';
export type { WorkflowEditorProps } from './components/WorkflowEditor';

export { Canvas } from './components/Canvas';
export type { CanvasProps } from './components/Canvas';

// Export workflow elements
export { Rectangle, Node as WorkflowNode } from './components/elements';
export type { RectangleProps, NodeProps as WorkflowNodeProps } from './components/elements';

// Export UI components
export { ContextMenu } from './components/ui';
export type { ContextMenuItem, ContextMenuProps } from './components/ui';

// Export types
export type { Workflow, Node, Edge } from './types';

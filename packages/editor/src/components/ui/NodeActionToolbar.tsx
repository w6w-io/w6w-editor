import { type FC, memo } from 'react';

interface NodeActionToolbarProps {
  nodeId: string;
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
}

// SVG Icons as components
const TrashIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PencilIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const CopyIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

/**
 * NodeActionToolbar - A floating toolbar component that appears above selected nodes
 * Provides quick access to common node actions like delete, edit, and duplicate
 */
export const NodeActionToolbar: FC<NodeActionToolbarProps> = memo(({
  nodeId,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(nodeId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(nodeId);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(nodeId);
  };

  return (
    <div className="node-action-toolbar">
      {onEdit && (
        <button
          className="node-action-toolbar-button"
          onClick={handleEdit}
          title="Edit node"
          aria-label="Edit node"
        >
          <PencilIcon />
        </button>
      )}
      {onDuplicate && (
        <button
          className="node-action-toolbar-button"
          onClick={handleDuplicate}
          title="Duplicate node"
          aria-label="Duplicate node"
        >
          <CopyIcon />
        </button>
      )}
      {onDelete && (
        <button
          className="node-action-toolbar-button destructive"
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
});

NodeActionToolbar.displayName = 'NodeActionToolbar';

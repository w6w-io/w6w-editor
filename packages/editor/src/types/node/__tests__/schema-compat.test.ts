import { describe, it, expect, vi } from 'vitest';
import type { WorkflowNodeData } from '../coupled';
import {
  NODE_TYPES,
  isValidNodeType,
  getNodeType,
  type NodeType,
} from '../index';

describe('Node Type Compatibility', () => {
  describe('NODE_TYPES constant', () => {
    it('should define all expected node types', () => {
      const expectedTypes: readonly string[] = [
        'trigger',
        'action',
        'transform',
        'condition',
        'loop',
      ];
      expect(NODE_TYPES).toEqual(expectedTypes);
    });

    it('should have exactly 5 node types', () => {
      expect(NODE_TYPES).toHaveLength(5);
    });

    it('should be a readonly array', () => {
      // TypeScript ensures this at compile time, but we can verify the values are stable
      const typesCopy = [...NODE_TYPES];
      expect(typesCopy).toEqual(NODE_TYPES);
    });
  });

  describe('isValidNodeType', () => {
    it('should return true for valid node types', () => {
      NODE_TYPES.forEach((type) => {
        expect(isValidNodeType(type)).toBe(true);
      });
    });

    it('should return false for invalid string values', () => {
      expect(isValidNodeType('invalid')).toBe(false);
      expect(isValidNodeType('TRIGGER')).toBe(false);
      expect(isValidNodeType('Action')).toBe(false);
      expect(isValidNodeType('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidNodeType(null)).toBe(false);
      expect(isValidNodeType(undefined)).toBe(false);
      expect(isValidNodeType(123)).toBe(false);
      expect(isValidNodeType({})).toBe(false);
      expect(isValidNodeType([])).toBe(false);
    });
  });

  describe('getNodeType', () => {
    it('should return type field when valid', () => {
      const data: WorkflowNodeData = { type: 'action' };
      expect(getNodeType(data)).toBe('action');
    });

    it('should return nodeType field when type is not set', () => {
      const data: WorkflowNodeData = { nodeType: 'trigger' };
      expect(getNodeType(data)).toBe('trigger');
    });

    it('should prefer type over nodeType', () => {
      const data: WorkflowNodeData = { type: 'action', nodeType: 'trigger' };
      expect(getNodeType(data)).toBe('action');
    });

    it('should return undefined when neither is valid', () => {
      const data: WorkflowNodeData = {};
      expect(getNodeType(data)).toBeUndefined();
    });

    it('should return undefined for invalid type values', () => {
      const data = { type: 'invalid' } as WorkflowNodeData;
      expect(getNodeType(data)).toBeUndefined();
    });
  });

  describe('WorkflowNodeData type compatibility', () => {
    it('should accept valid nodeType values', () => {
      NODE_TYPES.forEach((type) => {
        const data: WorkflowNodeData = { nodeType: type };
        expect(data.nodeType).toBe(type);
      });
    });

    it('should accept valid type values', () => {
      NODE_TYPES.forEach((type) => {
        const data: WorkflowNodeData = { type };
        expect(data.type).toBe(type);
      });
    });

    it('should include all schema-compatible fields', () => {
      const fullNode: WorkflowNodeData = {
        // Schema fields
        type: 'action',
        nodeType: 'action',
        package: '@w6w/apps',
        app: 'slack',
        version: '1.0.0',
        action: 'send_message',
        label: 'Send Slack Message',
        config: { channel: '#general' },
        disabled: false,
        notes: 'Sends a notification',
        input: ['in1'],
        output: ['out1'],
        authenticationId: 'auth_123',
        metadata: { createdAt: Date.now() },

        // UI-only fields
        appName: 'Slack',
        appIcon: 'slack-icon',
        onDelete: vi.fn(),
        onEdit: vi.fn(),
        onDuplicate: vi.fn(),
        onAddNode: vi.fn(),
        hasInputConnection: true,
        hasOutputConnection: false,
      };

      // Verify schema fields
      expect(fullNode.type).toBe('action');
      expect(fullNode.package).toBe('@w6w/apps');
      expect(fullNode.app).toBe('slack');
      expect(fullNode.version).toBe('1.0.0');
      expect(fullNode.action).toBe('send_message');
      expect(fullNode.label).toBe('Send Slack Message');
      expect(fullNode.config).toEqual({ channel: '#general' });
      expect(fullNode.disabled).toBe(false);
      expect(fullNode.notes).toBe('Sends a notification');
      expect(fullNode.input).toEqual(['in1']);
      expect(fullNode.output).toEqual(['out1']);
      expect(fullNode.authenticationId).toBe('auth_123');
      expect(fullNode.metadata).toBeDefined();

      // Verify UI fields
      expect(fullNode.appName).toBe('Slack');
      expect(fullNode.appIcon).toBe('slack-icon');
      expect(fullNode.onDelete).toBeDefined();
      expect(fullNode.onEdit).toBeDefined();
      expect(fullNode.onDuplicate).toBeDefined();
      expect(fullNode.onAddNode).toBeDefined();
      expect(fullNode.hasInputConnection).toBe(true);
      expect(fullNode.hasOutputConnection).toBe(false);
    });

    it('should allow UI-only fields without schema fields', () => {
      const uiNode: WorkflowNodeData = {
        label: 'UI Node',
        onDelete: vi.fn(),
        onEdit: vi.fn(),
        onDuplicate: vi.fn(),
        onAddNode: vi.fn(),
        hasInputConnection: true,
        hasOutputConnection: false,
        appIcon: '<svg></svg>',
      };

      expect(uiNode.onDelete).toBeDefined();
      expect(uiNode.hasInputConnection).toBe(true);
    });

    it('should allow additional custom properties via index signature', () => {
      const customNode: WorkflowNodeData = {
        label: 'Custom Node',
        customProperty: 'custom value',
        anotherCustom: 123,
      };

      expect(customNode.customProperty).toBe('custom value');
      expect(customNode.anotherCustom).toBe(123);
    });
  });

  describe('UI callback types', () => {
    it('should call onDelete with nodeId', () => {
      const onDelete = vi.fn();
      const data: WorkflowNodeData = { onDelete };

      data.onDelete?.('node_123');
      expect(onDelete).toHaveBeenCalledWith('node_123');
    });

    it('should call onEdit with nodeId', () => {
      const onEdit = vi.fn();
      const data: WorkflowNodeData = { onEdit };

      data.onEdit?.('node_123');
      expect(onEdit).toHaveBeenCalledWith('node_123');
    });

    it('should call onDuplicate with nodeId', () => {
      const onDuplicate = vi.fn();
      const data: WorkflowNodeData = { onDuplicate };

      data.onDuplicate?.('node_123');
      expect(onDuplicate).toHaveBeenCalledWith('node_123');
    });

    it('should call onAddNode with correct parameters', () => {
      const onAddNode = vi.fn();
      const data: WorkflowNodeData = { onAddNode };

      data.onAddNode?.('node_123', 'source', 'handle_1');
      expect(onAddNode).toHaveBeenCalledWith('node_123', 'source', 'handle_1');
    });

    it('should call onAddNode without optional handleId', () => {
      const onAddNode = vi.fn();
      const data: WorkflowNodeData = { onAddNode };

      data.onAddNode?.('node_456', 'target');
      expect(onAddNode).toHaveBeenCalledWith('node_456', 'target');
    });
  });
});

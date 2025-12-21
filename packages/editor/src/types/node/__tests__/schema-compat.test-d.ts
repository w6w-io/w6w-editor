import { expectTypeOf, describe, it } from 'vitest';
import type { ReactNode } from 'react';
import type { WorkflowNodeData, WorkflowNodeType } from '../coupled';
import type { NodeType, SchemaNodeFields, EditorNodeFields } from '../base';

describe('Type-level schema compatibility', () => {
  describe('NodeType', () => {
    it('should be a union of string literals', () => {
      expectTypeOf<NodeType>().toMatchTypeOf<string>();
    });

    it('should accept valid node type values', () => {
      expectTypeOf<'trigger'>().toMatchTypeOf<NodeType>();
      expectTypeOf<'action'>().toMatchTypeOf<NodeType>();
      expectTypeOf<'transform'>().toMatchTypeOf<NodeType>();
      expectTypeOf<'condition'>().toMatchTypeOf<NodeType>();
      expectTypeOf<'loop'>().toMatchTypeOf<NodeType>();
    });
  });

  describe('SchemaNodeFields', () => {
    it('type should accept NodeType', () => {
      expectTypeOf<SchemaNodeFields['type']>().toMatchTypeOf<
        NodeType | undefined
      >();
    });

    it('config should be a record type', () => {
      expectTypeOf<SchemaNodeFields['config']>().toMatchTypeOf<
        Record<string, unknown> | undefined
      >();
    });

    it('input and output should be string arrays', () => {
      expectTypeOf<SchemaNodeFields['input']>().toMatchTypeOf<
        string[] | undefined
      >();
      expectTypeOf<SchemaNodeFields['output']>().toMatchTypeOf<
        string[] | undefined
      >();
    });

    it('metadata should be a record type', () => {
      expectTypeOf<SchemaNodeFields['metadata']>().toMatchTypeOf<
        Record<string, unknown> | undefined
      >();
    });

    it('should have string fields', () => {
      expectTypeOf<SchemaNodeFields['package']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['app']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['version']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['action']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['label']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['notes']>().toMatchTypeOf<
        string | undefined
      >();
      expectTypeOf<SchemaNodeFields['authenticationId']>().toMatchTypeOf<
        string | undefined
      >();
    });

    it('disabled should be boolean', () => {
      expectTypeOf<SchemaNodeFields['disabled']>().toMatchTypeOf<
        boolean | undefined
      >();
    });
  });

  describe('EditorNodeFields', () => {
    it('appIcon should accept ReactNode or string', () => {
      expectTypeOf<EditorNodeFields['appIcon']>().toMatchTypeOf<
        ReactNode | string | undefined
      >();
    });

    it('callbacks should have correct signatures', () => {
      expectTypeOf<EditorNodeFields['onDelete']>().toMatchTypeOf<
        ((nodeId: string) => void) | undefined
      >();
      expectTypeOf<EditorNodeFields['onEdit']>().toMatchTypeOf<
        ((nodeId: string) => void) | undefined
      >();
      expectTypeOf<EditorNodeFields['onDuplicate']>().toMatchTypeOf<
        ((nodeId: string) => void) | undefined
      >();
    });

    it('onAddNode should have correct signature', () => {
      type ExpectedOnAddNode = (
        nodeId: string,
        handleType: 'source' | 'target',
        handleId?: string
      ) => void;
      expectTypeOf<EditorNodeFields['onAddNode']>().toMatchTypeOf<
        ExpectedOnAddNode | undefined
      >();
    });

    it('connection state should be boolean', () => {
      expectTypeOf<EditorNodeFields['hasInputConnection']>().toMatchTypeOf<
        boolean | undefined
      >();
      expectTypeOf<EditorNodeFields['hasOutputConnection']>().toMatchTypeOf<
        boolean | undefined
      >();
    });
  });

  describe('WorkflowNodeData', () => {
    it('should extend SchemaNodeFields', () => {
      expectTypeOf<WorkflowNodeData>().toMatchTypeOf<SchemaNodeFields>();
    });

    it('should extend EditorNodeFields', () => {
      expectTypeOf<WorkflowNodeData>().toMatchTypeOf<EditorNodeFields>();
    });

    it('nodeType should accept NodeType values', () => {
      expectTypeOf<WorkflowNodeData['nodeType']>().toMatchTypeOf<
        NodeType | undefined
      >();
    });

    it('should allow unknown properties via index signature', () => {
      // This verifies the index signature [key: string]: unknown
      type HasIndex = WorkflowNodeData extends { [key: string]: unknown }
        ? true
        : false;
      expectTypeOf<HasIndex>().toEqualTypeOf<true>();
    });
  });

  describe('WorkflowNodeType', () => {
    it('should have data property of type WorkflowNodeData', () => {
      expectTypeOf<WorkflowNodeType['data']>().toEqualTypeOf<WorkflowNodeData>();
    });

    it('should have id property of type string', () => {
      expectTypeOf<WorkflowNodeType['id']>().toEqualTypeOf<string>();
    });

    it('should have position property', () => {
      expectTypeOf<WorkflowNodeType['position']>().toMatchTypeOf<{
        x: number;
        y: number;
      }>();
    });
  });
});

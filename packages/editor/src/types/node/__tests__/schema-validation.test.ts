import { describe, it, expect, beforeAll } from 'vitest';
import type { WorkflowNodeData } from '../coupled';
import { NODE_TYPES } from '../index';

/**
 * Schema validation tests - only run when @w6w/schema is available
 *
 * These tests verify that our type definitions are compatible with the
 * actual schema package. They are skipped if the schema package is not installed.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodeSchema: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodeTypeEnum: any;
let schemaAvailable = false;

beforeAll(async () => {
  try {
    const schema = await import('@w6w/schema');
    nodeSchema = schema.nodeSchema;
    nodeTypeEnum = schema.nodeTypeEnum;
    schemaAvailable = true;
  } catch {
    // Schema not available, tests will be skipped
    console.log(
      'Note: @w6w/schema not available, schema validation tests will be skipped'
    );
  }
});

describe('Schema Package Integration (optional)', () => {
  it.skipIf(!schemaAvailable)(
    'NODE_TYPES should match schema nodeTypeEnum',
    () => {
      // Get the enum options from the schema
      const schemaTypes = nodeTypeEnum.options;
      expect([...NODE_TYPES]).toEqual(schemaTypes);
    }
  );

  it.skipIf(!schemaAvailable)(
    'should have the same number of node types as schema',
    () => {
      const schemaTypes = nodeTypeEnum.options;
      expect(NODE_TYPES.length).toBe(schemaTypes.length);
    }
  );

  it.skipIf(!schemaAvailable)(
    'WorkflowNodeData fields should be valid for schema',
    () => {
      const testNode: WorkflowNodeData = {
        type: 'action',
        package: 'test-package',
        app: 'test-app',
        version: '1.0.0',
        action: 'test-action',
        label: 'Test',
      };

      // Extract schema-compatible fields only (excluding UI fields)
      const schemaFields = {
        id: 'nd_test_001',
        type: testNode.type,
        package: testNode.package,
        app: testNode.app,
        version: testNode.version,
        action: testNode.action,
        label: testNode.label,
        position: [0, 0],
      };

      // Validate against schema
      const result = nodeSchema.safeParse(schemaFields);
      expect(result.success).toBe(true);
    }
  );

  it.skipIf(!schemaAvailable)(
    'all NODE_TYPES values should be valid in schema',
    () => {
      NODE_TYPES.forEach((type) => {
        const schemaFields = {
          id: 'nd_test_001',
          type,
          package: 'test-package',
          app: 'test-app',
          version: '1.0.0',
          action: 'test-action',
          position: [0, 0],
        };

        const result = nodeSchema.safeParse(schemaFields);
        expect(result.success).toBe(true);
      });
    }
  );

  it.skipIf(!schemaAvailable)(
    'optional schema fields should validate correctly',
    () => {
      const fullSchemaFields = {
        id: 'nd_test_full',
        type: 'action' as const,
        package: 'test-package',
        app: 'test-app',
        version: '1.0.0',
        action: 'test-action',
        position: [100, 200],
        label: 'Full Test Node',
        config: { setting: 'value' },
        disabled: false,
        notes: 'Test notes',
        input: ['in1', 'in2'],
        output: ['out1'],
        authenticationId: 'auth_123',
        metadata: { custom: 'data' },
      };

      const result = nodeSchema.safeParse(fullSchemaFields);
      expect(result.success).toBe(true);
    }
  );

  it.skipIf(!schemaAvailable)(
    'UI-only fields should not interfere with schema validation',
    () => {
      // When serializing WorkflowNodeData for schema, UI fields should be excluded
      const nodeWithUIFields: WorkflowNodeData = {
        type: 'trigger',
        package: 'test-package',
        app: 'test-app',
        version: '1.0.0',
        action: 'test-action',
        // UI-only fields that should NOT be sent to schema
        appName: 'Test App',
        appIcon: 'icon-test',
        onDelete: () => {},
        hasInputConnection: true,
      };

      // Extract only schema-compatible fields
      const { appName, appIcon, onDelete, hasInputConnection, ...schemaOnly } =
        nodeWithUIFields;

      const schemaFields = {
        ...schemaOnly,
        id: 'nd_ui_test',
        position: [0, 0],
      };

      const result = nodeSchema.safeParse(schemaFields);
      expect(result.success).toBe(true);
    }
  );
});

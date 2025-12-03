import { describe, it, expect } from 'vitest';
import { workflowSchema } from '../src';
import mockWorkflow from '../__mocks__/jb_order_confirmation.json';

describe('Workflow Schema Validation', () => {
  it('should validate the converted JB order confirmation workflow', () => {
    const result = workflowSchema.safeParse(mockWorkflow);
    
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }

    expect(result.success).toBe(true);
  });
});

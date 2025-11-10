import { z } from 'zod';
import { idSchema } from './id';
import { positionSchema } from './position';

export const nodeSchema = z.object({
    id: idSchema('node'),
    label: z.string().describe('Display label shown in the editor').optional(),
    position: positionSchema.describe('Visual position on the canvas'),
    config: z.record(z.string(), z.any()).describe('Node-specific configuration set by the user').optional(),
    notes: z.string().max(1000, {
        message: 'Notes cannot exceed 1000 characters'
    }).optional(),
    disabled: z.boolean().default(false).describe('Whether this node is disabled in execution'),
    input: z.array(z.string()).describe('Input ports/handles for receiving data').optional(),
    output: z.array(z.string()).describe('Output ports/handles for sending data').optional()
});
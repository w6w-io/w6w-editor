import { z } from 'zod';
import { idSchema } from './id';
import { CONSTS } from './consts';

/**
 * Log level for execution events
 */
export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

/**
 * Log entry for a single execution event
 */
export const executionLogEntrySchema = z.object({
  timestamp: z.number().describe('Unix timestamp in milliseconds when the log entry was created'),

  level: logLevelSchema.describe('Severity level of the log entry'),

  nodeId: z.string().optional().describe('Node ID if this log is related to a specific node'),

  message: z.string().describe('Human-readable log message'),

  data: z.record(z.string(), z.any()).optional().describe('Additional structured data associated with this log entry'),

  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    code: z.string().optional(),
  }).optional().describe('Error details if this log entry represents an error'),
});

/**
 * Complete execution log for a workflow run
 */
export const executionLogSchema = z.object({
  executionId: idSchema(CONSTS.idPrefix.execution).describe('Unique execution identifier'),

  workflowId: idSchema(CONSTS.idPrefix.workflow).describe('Workflow identifier'),

  status: z.enum(['running', 'completed', 'failed', 'cancelled']).describe('Current status of the execution'),

  startedAt: z.number().describe('Unix timestamp in milliseconds when execution started'),

  completedAt: z.number().optional().describe('Unix timestamp in milliseconds when execution completed (success or failure)'),

  entries: z.array(executionLogEntrySchema).describe('Chronological list of log entries'),

  metadata: z.object({
    triggeredBy: z.string().optional().describe('User or system that triggered the execution'),
    triggerType: z.enum(['manual', 'scheduled', 'webhook', 'api']).optional(),
  }).optional().describe('Additional metadata about the execution'),
});

export type LogLevel = z.infer<typeof logLevelSchema>;
export type ExecutionLogEntry = z.infer<typeof executionLogEntrySchema>;
export type ExecutionLog = z.infer<typeof executionLogSchema>;

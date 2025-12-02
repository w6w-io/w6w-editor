// action.ts
import { z } from 'zod';
import { propertySchema } from './property';

export const actionCategoryEnum = z.enum([
    'read',
    'write',
    'trigger',
]);

/**
 * REST configuration schema (serializable)
 */
export const restConfigSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    url: z.string(),  // supports templates: "https://api.com/{{config.org_id}}/events"
    headers: z.record(z.string(), z.string()).optional(),
    body: z.any().optional(),
    responseMapping: z.record(z.string(), z.string()).optional(),
});

export type RestConfig = z.infer<typeof restConfigSchema>;

export const actionDefinitionSchema = z.object({
    /**
     * Unique key within the app
     * @example "list-events", "create-event"
     */
    key: z.string().min(1).regex(/^[a-z0-9-]+$/),

    /**
     * Display name
     * @example "List Events", "Create Event"
     */
    displayName: z.string().min(1),

    /**
     * Description
     */
    description: z.string().optional(),

    /**
     * Category
     */
    category: actionCategoryEnum,

    /**
     * Group for UI organization (optional)
     * @example "events", "tickets", "orders"
     */
    group: z.string().optional(),

    /**
     * Input properties (form definition)
     */
    properties: z.array(propertySchema),

    /**
     * Output schema (what this action returns)
     * Used for connecting nodes + autocomplete
     */
    outputSchema: z.record(z.string(), z.any()).optional(),

    /**
     * Does this action require authentication?
     * @default true
     */
    requiresAuth: z.boolean().default(true),

    /**
     * Declarative REST config (optional)
     * If provided, worker handles HTTP call
     */
    rest: restConfigSchema.optional(),
});

export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;


// --- Runtime interfaces (not serializable) ---

export interface ExecutionContext {
    credentials: Record<string, any>;
    variables: Record<string, any>;
    execution: {
        id: string;
        workflow_id: string;
    };
    log: (message: string) => void;
    fetch: typeof fetch;
}

export interface ExecuteParams {
    config: Record<string, any>;      // user's form values
    input: Record<string, any>;       // data from upstream nodes
    context: ExecutionContext;
}

export interface ExecuteResult {
    data: Record<string, any>;
    metadata?: {
        cached?: boolean;
        duration?: number;
    };
}

export interface Action extends ActionDefinition {
    /**
     * Custom execution (if no rest config)
     */
    execute?: (params: ExecuteParams) => Promise<ExecuteResult>;

    /**
     * Transform config/input before execution
     */
    preProcess?: (params: ExecuteParams) => Promise<{ config: Record<string, any>; input: Record<string, any> }>;

    /**
     * Transform result after execution
     */
    postProcess?: (result: ExecuteResult, context: ExecutionContext) => Promise<ExecuteResult>;

    /**
     * Validate config before execution
     */
    validate?: (config: Record<string, any>) => string | null;
}
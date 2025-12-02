// app.ts
import { z } from 'zod';
import { actionDefinitionSchema } from './action';

export const appDefinitionSchema = z.object({
  /**
   * Unique key within the package
   * @example "myapp", "slack", "http"
   */
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),

  /**
   * Display name
   * @example "MyApp", "Slack", "HTTP Request"
   */
  displayName: z.string().min(1),

  /**
   * Description
   */
  description: z.string().optional(),

  /**
   * Icon (URL or identifier)
   */
  icon: z.string().optional(),


  /**
   * Credential keys this app can use
   * @example ["myapp-oauth", "myapp-api-key"]
   */
  credentials: z.array(z.string()).optional(),

  /**
   * Available actions
   */
  actions: z.record(z.string(), actionDefinitionSchema),

  /**
   * App-level default config
   * Applied to all actions unless overridden
   */
  defaults: z.record(z.string(), z.any()).optional(),
});

export type AppDefinition = z.infer<typeof appDefinitionSchema>;
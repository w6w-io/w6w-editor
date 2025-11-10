import { z } from 'zod';

/**
 * Creates a Zod schema for validating IDs with a specific prefix pattern.
 *
 * ID Format: `{prefix}_{alphanumeric}`
 *
 * Examples:
 * - Workflow: `wf_customer_onboarding`, `wf_data_pipeline_123`
 * - Trigger: `trigger_webhook_1`, `trigger_daily_sync`
 * - Connection: `conn_slack_main`, `conn_postgres_db`
 *
 * @param prefix - The type prefix for the ID (e.g., 'wf', 'trigger', 'conn')
 * @returns Zod string schema with regex validation and error message
 */
export const idSchema = (prefix: string) =>
    z.string().regex(
        new RegExp(`^${prefix}_[a-zA-Z0-9_]+$`),
        {
            message: `ID must match pattern: ${prefix}_{identifier} (alphanumeric and underscores only)`
        }
    );
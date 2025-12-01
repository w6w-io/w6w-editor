import z from "zod";
import { propertySchema } from "./property";

/**
 * OAuth2 Claims Schema
 * @description Additional claims/scopes for OAuth2.0 authentication
 */
export const oauth2ClaimsSchema = z.object({
  /**
   * OAuth2 scopes
   * @description List of permission scopes requested
   * @example ["read:user", "write:repo"]
   */
  scopes: z.array(z.string()).optional(),

  /**
   * Additional custom claims
   * @description Custom claims for specific OAuth providers
   */
  customClaims: z.record(z.string(), z.any()).optional(),
});

export type OAuth2Claims = z.infer<typeof oauth2ClaimsSchema>;

/**
 * OAuth2 Configuration Schema
 * @description Configuration for OAuth2.0 authentication
 */
export const oauth2ConfigSchema = z.object({
  /**
   * Client ID
   * @description OAuth2 application client ID
   */
  clientId: z.string().min(1, { message: "Client ID is required" }),

  /**
   * Client Secret
   * @description OAuth2 application client secret
   */
  clientSecret: z.string().min(1, { message: "Client secret is required" }),

  /**
   * Authorization URL
   * @description URL for OAuth2 authorization endpoint
   * @example "https://github.com/login/oauth/authorize"
   */
  authorizationUrl: z.string().min(1).refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Must be a valid URL" }),

  /**
   * Token URL
   * @description URL for OAuth2 token endpoint
   * @example "https://github.com/login/oauth/access_token"
   */
  tokenUrl: z.string().min(1).refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Must be a valid URL" }),

  /**
   * Redirect URI
   * @description Callback URL after OAuth authorization
   * @example "https://app.example.com/oauth/callback"
   */
  redirectUri: z.string().min(1).refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Must be a valid URL" }),

  /**
   * OAuth2 Claims
   * @description Scopes and additional claims
   */
  claims: oauth2ClaimsSchema.optional(),

  /**
   * Additional OAuth2 parameters
   * @description Provider-specific OAuth parameters
   */
  additionalParams: z.record(z.string(), z.any()).optional(),
});

export type OAuth2Config = z.infer<typeof oauth2ConfigSchema>;

/**
 * API Token Configuration Schema
 * @description Configuration for simple API token authentication
 */
export const apiTokenConfigSchema = z.object({
  /**
   * Token value
   * @description The API token/key value
   */
  token: z.string().min(1, { message: "Token is required" }),

  /**
   * Token header name
   * @description HTTP header name for the token
   * @example "Authorization", "X-API-Key"
   * @default "Authorization"
   */
  headerName: z.string().default("Authorization"),

  /**
   * Token prefix
   * @description Prefix for the token value in the header
   * @example "Bearer", "Token"
   */
  tokenPrefix: z.string().optional(),
});

export type ApiTokenConfig = z.infer<typeof apiTokenConfigSchema>;

/**
 * Authentication Method Schema
 * @description Discriminated union for different auth methods
 */
export const authMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("apiToken"),
    config: apiTokenConfigSchema,
  }),
  z.object({
    type: z.literal("oauth2"),
    config: oauth2ConfigSchema,
  }),
]);

export type AuthMethod = z.infer<typeof authMethodSchema>;

/**
 * Credential Schema
 * @description Schema for storing and managing authentication credentials
 */
export const credentialSchema = z.object({
  /**
   * Credential unique key
   * @description Unique identifier for the credential
   * @example "github_oauth", "slack_api_token"
   */
  key: z
    .string()
    .min(1, { message: "Key is required" })
    .max(100, { message: "Key must be at most 100 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Key must contain only alphanumeric characters, hyphens, and underscores",
    }),

  /**
   * Credential display name
   * @description Human-readable name for the credential
   * @example "GitHub OAuth", "Slack API Token"
   */
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be at most 200 characters" }),

  /**
   * Documentation URL
   * @description Link to authentication documentation
   * @example "https://docs.github.com/en/developers/apps/building-oauth-apps"
   */
  documentationUrl: z.string().min(1).refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Must be a valid URL" }).optional(),

  /**
   * Icon identifier
   * @description Icon string/URL for visual representation
   * @example "github", "https://example.com/icon.svg"
   */
  icon: z.string().optional(),

  /**
   * Authentication method
   * @description The authentication method and its configuration
   */
  authMethod: authMethodSchema,

  /**
   * Description
   * @description User-friendly description of the credential
   * @example "OAuth credentials for GitHub API access"
   */
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters" })
    .optional(),

  /**
   * Metadata
   * @description Additional metadata for extensibility
   */
  metadata: z.record(z.string(), z.any()).optional(),

  /**
   * Created timestamp
   * @description When the credential was created
   */
  createdAt: z.date().optional(),

  /**
   * Updated timestamp
   * @description When the credential was last updated
   */
  updatedAt: z.date().optional(),


  properties:   z.array(propertySchema).describe("List of properties associated with the credential").optional(),
});

export type Credential = z.infer<typeof credentialSchema>;

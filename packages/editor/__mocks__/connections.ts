/**
 * Mock connection/authentication data for testing and stories
 * These connections conform to the connection schema from @w6w-io/schema
 *
 * Note: Types are defined inline to keep this package lightweight.
 * They match the schema definitions from @w6w-io/schema.
 */

type OAuthConnection = {
  type: 'oauth';
  id: string;
  name: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
  metadata?: Record<string, any>;
};

type BearerConnection = {
  type: 'bearer';
  id: string;
  name: string;
  token: string;
  metadata?: Record<string, any>;
};

type CustomHeaderConnection = {
  type: 'custom_header';
  id: string;
  name: string;
  headers?: Record<string, string>;
  body?: Record<string, string>;
  query?: Record<string, string>;
  metadata?: Record<string, any>;
};

type Connection = OAuthConnection | BearerConnection | CustomHeaderConnection;

/**
 * OAuth 2.0 connection for API access
 */
export const oauthConnection: OAuthConnection = {
  type: 'oauth',
  id: 'cn_oauth_001',
  name: 'GitHub OAuth',
  provider: 'github',
  accessToken: 'mock_access_token_abc123',
  refreshToken: 'mock_refresh_token_xyz789',
  expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  scopes: ['repo', 'user'],
  metadata: {
    username: 'mock_user',
  },
};

/**
 * OAuth connection for Google APIs
 */
export const googleOAuthConnection: OAuthConnection = {
  type: 'oauth',
  id: 'cn_oauth_002',
  name: 'Google OAuth',
  provider: 'google',
  accessToken: 'mock_google_access_token_def456',
  refreshToken: 'mock_google_refresh_token_uvw123',
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/gmail.send'],
};

/**
 * Bearer token authentication
 */
export const bearerTokenConnection: BearerConnection = {
  type: 'bearer',
  id: 'cn_bearer_001',
  name: 'API Bearer Token',
  token: 'mock_bearer_token_abc123xyz',
};

/**
 * API key as bearer token
 */
export const apiKeyConnection: BearerConnection = {
  type: 'bearer',
  id: 'cn_apikey_001',
  name: 'Service API Key',
  token: 'mock_api_key_789def',
  metadata: {
    description: 'Production API key',
  },
};

/**
 * Custom header authentication
 */
export const customHeaderConnection: CustomHeaderConnection = {
  type: 'custom_header',
  id: 'cn_header_001',
  name: 'Custom Header Auth',
  headers: {
    'X-API-Key': 'mock_custom_api_key',
    'X-Client-ID': 'mock_client_id',
  },
};

/**
 * Custom header with body parameters
 */
export const customAuthConnection: CustomHeaderConnection = {
  type: 'custom_header',
  id: 'cn_custom_001',
  name: 'Custom Authentication',
  headers: {
    'Authorization': 'Custom mock_token_123',
  },
  body: {
    client_id: 'mock_client_id',
    grant_type: 'client_credentials',
  },
  query: {
    api_version: 'v2',
  },
};

/**
 * Collection of all mock connections
 */
export const mockConnections: Connection[] = [
  oauthConnection,
  googleOAuthConnection,
  bearerTokenConnection,
  apiKeyConnection,
  customHeaderConnection,
  customAuthConnection,
];

/**
 * Get a connection by ID
 */
export function getConnectionById(id: string): Connection | undefined {
  return mockConnections.find((connection) => connection.id === id);
}

/**
 * Get connections by type
 */
export function getConnectionsByType(type: Connection['type']): Connection[] {
  return mockConnections.filter((connection) => connection.type === type);
}

/**
 * Get connection by name
 */
export function getConnectionByName(name: string): Connection | undefined {
  return mockConnections.find((connection) => connection.name === name);
}

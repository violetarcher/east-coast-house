import { OpenFgaClient, CredentialsMethod } from '@openfga/sdk';

let _client: OpenFgaClient | null = null;

export function getFgaClient(): OpenFgaClient {
  if (!_client) {
    _client = new OpenFgaClient({
      apiUrl: process.env.FGA_API_URL!,
      storeId: process.env.FGA_STORE_ID!,
      credentials: {
        method: CredentialsMethod.ClientCredentials,
        config: {
          apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER!,
          apiAudience: process.env.FGA_API_AUDIENCE!,
          clientId: process.env.FGA_CLIENT_ID!,
          clientSecret: process.env.FGA_CLIENT_SECRET!,
        },
      },
    });
  }
  return _client;
}

export async function fgaCheck(
  user: string,
  relation: string,
  object: string,
  context?: Record<string, unknown>
): Promise<{ allowed: boolean }> {
  const client = getFgaClient();
  const result = await client.check({
    user,
    relation,
    object,
    ...(context ? { context } : {}),
  });
  return { allowed: result.allowed ?? false };
}

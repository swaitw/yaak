import type { Context } from '@yaakapp/api';
import type { AccessToken } from './store';
import { getToken } from './store';

export async function getAccessTokenIfNotExpired(
  ctx: Context,
  contextId: string,
): Promise<AccessToken | null> {
  const token = await getToken(ctx, contextId);
  if (token == null || isTokenExpired(token)) {
    return null;
  }

  return token;
}

export function isTokenExpired(token: AccessToken) {
  return token.expiresAt && Date.now() > token.expiresAt;
}

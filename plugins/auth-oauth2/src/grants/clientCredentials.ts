import type { Context } from '@yaakapp/api';
import { fetchAccessToken } from '../fetchAccessToken';
import { isTokenExpired } from '../getAccessTokenIfNotExpired';
import { getToken, storeToken } from '../store';

export async function getClientCredentials(
  ctx: Context,
  contextId: string,
  {
    accessTokenUrl,
    clientId,
    clientSecret,
    scope,
    audience,
    credentialsInBody,
  }: {
    accessTokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string | null;
    audience: string | null;
    credentialsInBody: boolean;
  },
) {
  const token = await getToken(ctx, contextId);
  if (token && !isTokenExpired(token)) {
    return token;
  }

  const response = await fetchAccessToken(ctx, {
    grantType: 'client_credentials',
    accessTokenUrl,
    audience,
    clientId,
    clientSecret,
    scope,
    credentialsInBody,
    params: [],
  });

  return storeToken(ctx, contextId, response);
}

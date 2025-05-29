import { Context } from '@yaakapp/api';

export async function storeToken(ctx: Context, contextId: string, response: AccessTokenRawResponse) {
  if (!response.access_token) {
    throw new Error(`Token not found in response`);
  }

  const expiresAt = response.expires_in ? Date.now() + response.expires_in * 1000 : null;
  const token: AccessToken = {
    response,
    expiresAt,
  };
  await ctx.store.set<AccessToken>(tokenStoreKey(contextId), token);
  return token;
}

export async function getToken(ctx: Context, contextId: string) {
  return ctx.store.get<AccessToken>(tokenStoreKey(contextId));
}

export async function deleteToken(ctx: Context, contextId: string) {
  return ctx.store.delete(tokenStoreKey(contextId));
}

export async function resetDataDirKey(ctx: Context, contextId: string) {
  const key = new Date().toISOString();
  return ctx.store.set<string>(dataDirStoreKey(contextId), key);
}

export async function getDataDirKey(ctx: Context, contextId: string) {
  const key = (await ctx.store.get<string>(dataDirStoreKey(contextId))) ?? 'default';
  return `${contextId}::${key}`;
}

function tokenStoreKey(context_id: string) {
  return ['token', context_id].join('::');
}

function dataDirStoreKey(context_id: string) {
  return ['data_dir', context_id].join('::');
}

export interface AccessToken {
  response: AccessTokenRawResponse,
  expiresAt: number | null;
}

export interface AccessTokenRawResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  scope?: string;
}

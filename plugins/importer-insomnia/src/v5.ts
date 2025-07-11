import { PartialImportResources } from '@yaakapp/api';
import { convertId, convertSyntax, isJSObject } from './common';

export function convertInsomniaV5(parsed: Record<string, any>) {
  if (!Array.isArray(parsed.collection)) return null;

  const resources: PartialImportResources = {
    environments: [],
    folders: [],
    grpcRequests: [],
    httpRequests: [],
    websocketRequests: [],
    workspaces: [],
  };

  // Import workspaces
  const meta: Record<string, any> = parsed.meta ?? {};
  resources.workspaces.push({
    id: convertId(meta.id ?? 'collection'),
    createdAt: meta.created ? new Date(meta.created).toISOString().replace('Z', '') : undefined,
    updatedAt: meta.modified ? new Date(meta.modified).toISOString().replace('Z', '') : undefined,
    model: 'workspace',
    name: parsed.name,
    description: meta.description || undefined,
  });
  resources.environments.push(
    importEnvironment(parsed.environments, meta.id, true),
    ...(parsed.environments.subEnvironments ?? []).map((r: any) => importEnvironment(r, meta.id)),
  );

  const nextFolder = (children: any[], parentId: string) => {
    for (const child of children ?? []) {
      if (!isJSObject(child)) continue;

      if (Array.isArray(child.children)) {
        resources.folders.push(importFolder(child, meta.id, parentId));
        nextFolder(child.children, child.meta.id);
      } else if (child.method) {
        resources.httpRequests.push(
          importHttpRequest(child, meta.id, parentId),
        );
      } else if (child.protoFileId) {
        resources.grpcRequests.push(
          importGrpcRequest(child, meta.id, parentId),
        );
      } else if (child.url) {
        resources.websocketRequests.push(
          importWebsocketRequest(child, meta.id, parentId),
        );
      }
    }
  };

  // Import folders
  nextFolder(parsed.collection ?? [], meta.id);

  // Filter out any `null` values
  resources.httpRequests = resources.httpRequests.filter(Boolean);
  resources.grpcRequests = resources.grpcRequests.filter(Boolean);
  resources.environments = resources.environments.filter(Boolean);
  resources.workspaces = resources.workspaces.filter(Boolean);

  return { resources };
}

function importHttpRequest(
  r: any,
  workspaceId: string,
  parentId: string,
): PartialImportResources['httpRequests'][0] {
  const id = r.meta?.id ?? r._id;
  const created = r.meta?.created ?? r.created;
  const updated = r.meta?.modified ?? r.updated;
  const sortKey = r.meta?.sortKey ?? r.sortKey;

  let bodyType: string | null = null;
  let body = {};
  if (r.body?.mimeType === 'application/octet-stream') {
    bodyType = 'binary';
    body = { filePath: r.body.fileName ?? '' };
  } else if (r.body?.mimeType === 'application/x-www-form-urlencoded') {
    bodyType = 'application/x-www-form-urlencoded';
    body = {
      form: (r.body.params ?? []).map((p: any) => ({
        enabled: !p.disabled,
        name: p.name ?? '',
        value: p.value ?? '',
      })),
    };
  } else if (r.body?.mimeType === 'multipart/form-data') {
    bodyType = 'multipart/form-data';
    body = {
      form: (r.body.params ?? []).map((p: any) => ({
        enabled: !p.disabled,
        name: p.name ?? '',
        value: p.value ?? '',
        file: p.fileName ?? null,
      })),
    };
  } else if (r.body?.mimeType === 'application/graphql') {
    bodyType = 'graphql';
    body = { text: convertSyntax(r.body.text ?? '') };
  } else if (r.body?.mimeType === 'application/json') {
    bodyType = 'application/json';
    body = { text: convertSyntax(r.body.text ?? '') };
  }

  return {
    id: convertId(id),
    workspaceId: convertId(workspaceId),
    createdAt: created ? new Date(created).toISOString().replace('Z', '') : undefined,
    updatedAt: updated ? new Date(updated).toISOString().replace('Z', '') : undefined,
    folderId: parentId === workspaceId ? null : convertId(parentId),
    sortPriority: sortKey,
    model: 'http_request',
    name: r.name,
    description: r.meta?.description || undefined,
    url: convertSyntax(r.url),
    body,
    bodyType,
    method: r.method,
    ...importHeaders(r),
    ...importAuthentication(r),
  };
}

function importGrpcRequest(
  r: any,
  workspaceId: string,
  parentId: string,
): PartialImportResources['grpcRequests'][0] {
  const id = r.meta?.id ?? r._id;
  const created = r.meta?.created ?? r.created;
  const updated = r.meta?.modified ?? r.updated;
  const sortKey = r.meta?.sortKey ?? r.sortKey;

  const parts = r.protoMethodName.split('/').filter((p: any) => p !== '');
  const service = parts[0] ?? null;
  const method = parts[1] ?? null;

  return {
    model: 'grpc_request',
    id: convertId(id),
    workspaceId: convertId(workspaceId),
    createdAt: created ? new Date(created).toISOString().replace('Z', '') : undefined,
    updatedAt: updated ? new Date(updated).toISOString().replace('Z', '') : undefined,
    folderId: parentId === workspaceId ? null : convertId(parentId),
    sortPriority: sortKey,
    name: r.name,
    description: r.description || undefined,
    url: convertSyntax(r.url),
    service,
    method,
    message: r.body?.text ?? '',
    metadata: (r.metadata ?? [])
      .map((h: any) => ({
        enabled: !h.disabled,
        name: h.name ?? '',
        value: h.value ?? '',
      }))
      .filter(({ name, value }: any) => name !== '' || value !== ''),
  };
}

function importWebsocketRequest(
  r: any,
  workspaceId: string,
  parentId: string,
): PartialImportResources['websocketRequests'][0] {
  const id = r.meta?.id ?? r._id;
  const created = r.meta?.created ?? r.created;
  const updated = r.meta?.modified ?? r.updated;
  const sortKey = r.meta?.sortKey ?? r.sortKey;

  return {
    model: 'websocket_request',
    id: convertId(id),
    workspaceId: convertId(workspaceId),
    createdAt: created ? new Date(created).toISOString().replace('Z', '') : undefined,
    updatedAt: updated ? new Date(updated).toISOString().replace('Z', '') : undefined,
    folderId: parentId === workspaceId ? null : convertId(parentId),
    sortPriority: sortKey,
    name: r.name,
    description: r.description || undefined,
    url: convertSyntax(r.url),
    message: r.body?.text ?? '',
    ...importHeaders(r),
    ...importAuthentication(r),
  };
}

function importHeaders(r: any) {
  const headers = (r.headers ?? [])
    .map((h: any) => ({
      enabled: !h.disabled,
      name: h.name ?? '',
      value: h.value ?? '',
    }))
    .filter(({ name, value }: any) => name !== '' || value !== '');
  return { headers } as const;
}

function importAuthentication(r: any) {
  let authenticationType: string | null = null;
  let authentication = {};
  if (r.authentication?.type === 'bearer') {
    authenticationType = 'bearer';
    authentication = {
      token: convertSyntax(r.authentication.token),
    };
  } else if (r.authentication?.type === 'basic') {
    authenticationType = 'basic';
    authentication = {
      username: convertSyntax(r.authentication.username),
      password: convertSyntax(r.authentication.password),
    };
  }

  return { authenticationType, authentication } as const;
}

function importFolder(f: any, workspaceId: string, parentId: string): PartialImportResources['folders'][0] {
  const id = f.meta?.id ?? f._id;
  const created = f.meta?.created ?? f.created;
  const updated = f.meta?.modified ?? f.updated;
  const sortKey = f.meta?.sortKey ?? f.sortKey;

  return {
    model: 'folder',
    id: convertId(id),
    createdAt: created ? new Date(created).toISOString().replace('Z', '') : undefined,
    updatedAt: updated ? new Date(updated).toISOString().replace('Z', '') : undefined,
    folderId: parentId === workspaceId ? null : convertId(parentId),
    sortPriority: sortKey,
    workspaceId: convertId(workspaceId),
    description: f.description || undefined,
    name: f.name,
  };
}


function importEnvironment(e: any, workspaceId: string, isParent?: boolean): PartialImportResources['environments'][0] {
  const id = e.meta?.id ?? e._id;
  const created = e.meta?.created ?? e.created;
  const updated = e.meta?.modified ?? e.updated;
  const sortKey = e.meta?.sortKey ?? e.sortKey;

  return {
    id: convertId(id),
    createdAt: created ? new Date(created).toISOString().replace('Z', '') : undefined,
    updatedAt: updated ? new Date(updated).toISOString().replace('Z', '') : undefined,
    workspaceId: convertId(workspaceId),
    public: !e.isPrivate,
    // @ts-ignore
    sortPriority: sortKey, // Will be added to Yaak later
    base: isParent ?? e.parentId === workspaceId,
    model: 'environment',
    name: e.name,
    variables: Object.entries(e.data ?? {}).map(([name, value]) => ({
      enabled: true,
      name,
      value: `${value}`,
    })),
  };
}

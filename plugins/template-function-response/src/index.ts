import { DOMParser } from '@xmldom/xmldom';
import type {
  CallTemplateFunctionArgs,
  Context,
  FormInput,
  HttpResponse,
  PluginDefinition,
  RenderPurpose,
} from '@yaakapp/api';
import { JSONPath } from 'jsonpath-plus';
import { readFileSync } from 'node:fs';
import xpath from 'xpath';

const behaviorArg: FormInput = {
  type: 'select',
  name: 'behavior',
  label: 'Sending Behavior',
  defaultValue: 'smart',
  options: [
    { label: 'When no responses', value: 'smart' },
    { label: 'Always', value: 'always' },
  ],
};

const requestArg: FormInput = {
  type: 'http_request',
  name: 'request',
  label: 'Request',
};

export const plugin: PluginDefinition = {
  templateFunctions: [
    {
      name: 'response.header',
      description: 'Read the value of a response header, by name',
      args: [
        requestArg,
        {
          type: 'text',
          name: 'header',
          label: 'Header Name',
          placeholder: 'Content-Type',
        },
        behaviorArg,
      ],
      async onRender(ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        if (!args.values.request || !args.values.header) return null;

        const response = await getResponse(ctx, {
          requestId: String(args.values.request || ''),
          purpose: args.purpose,
          behavior: args.values.behavior ? String(args.values.behavior) : null,
        });
        if (response == null) return null;

        const header = response.headers.find(
          (h) => h.name.toLowerCase() === String(args.values.header ?? '').toLowerCase(),
        );
        return header?.value ?? null;
      },
    },
    {
      name: 'response.body.path',
      description: 'Access a field of the response body using JsonPath or XPath',
      aliases: ['response'],
      args: [
        requestArg,
        {
          type: 'text',
          name: 'path',
          label: 'JSONPath or XPath',
          placeholder: '$.books[0].id or /books[0]/id',
        },
        behaviorArg,
      ],
      async onRender(ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        if (!args.values.request || !args.values.path) return null;

        const response = await getResponse(ctx, {
          requestId: String(args.values.request || ''),
          purpose: args.purpose,
          behavior: args.values.behavior ? String(args.values.behavior) : null,
        });
        if (response == null) return null;

        if (response.bodyPath == null) {
          return null;
        }

        let body;
        try {
          body = readFileSync(response.bodyPath, 'utf-8');
        } catch {
          return null;
        }

        try {
          return filterJSONPath(body, String(args.values.path || ''));
        } catch {
          // Probably not JSON, try XPath
        }

        try {
          return filterXPath(body, String(args.values.path || ''));
        } catch {
          // Probably not XML
        }

        return null; // Bail out
      },
    },
    {
      name: 'response.body.raw',
      description: 'Access the entire response body, as text',
      aliases: ['response'],
      args: [requestArg, behaviorArg],
      async onRender(ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        if (!args.values.request) return null;

        const response = await getResponse(ctx, {
          requestId: String(args.values.request || ''),
          purpose: args.purpose,
          behavior: args.values.behavior ? String(args.values.behavior) : null,
        });
        if (response == null) return null;

        if (response.bodyPath == null) {
          return null;
        }

        let body;
        try {
          body = readFileSync(response.bodyPath, 'utf-8');
        } catch {
          return null;
        }

        return body;
      },
    },
  ],
};

function filterJSONPath(body: string, path: string): string {
  const parsed = JSON.parse(body);
  const items = JSONPath({ path, json: parsed })[0];
  if (items == null) {
    return '';
  }

  if (
    Object.prototype.toString.call(items) === '[object Array]' ||
    Object.prototype.toString.call(items) === '[object Object]'
  ) {
    return JSON.stringify(items);
  } else {
    return String(items);
  }
}

function filterXPath(body: string, path: string): string {
  const doc = new DOMParser().parseFromString(body, 'text/xml');
  const items = xpath.select(path, doc, false);

  if (Array.isArray(items)) {
    return items[0] != null ? String(items[0].firstChild ?? '') : '';
  } else {
    // Not sure what cases this happens in (?)
    return String(items);
  }
}

async function getResponse(
  ctx: Context,
  {
    requestId,
    behavior,
    purpose,
  }: {
    requestId: string;
    behavior: string | null;
    purpose: RenderPurpose;
  },
): Promise<HttpResponse | null> {
  if (!requestId) return null;

  const httpRequest = await ctx.httpRequest.getById({ id: requestId ?? 'n/a' });
  if (httpRequest == null) {
    return null;
  }

  const responses = await ctx.httpResponse.find({ requestId: httpRequest.id, limit: 1 });

  if (behavior === 'never' && responses.length === 0) {
    return null;
  }

  let response: HttpResponse | null = responses[0] ?? null;

  // Previews happen a ton, and we don't want to send too many times on "always," so treat
  // it as "smart" during preview.
  const finalBehavior = behavior === 'always' && purpose === 'preview' ? 'smart' : behavior;

  // Send if no responses and "smart," or "always"
  if ((finalBehavior === 'smart' && response == null) || finalBehavior === 'always') {
    // NOTE: Render inside this conditional, or we'll get infinite recursion (render->render->...)
    const renderedHttpRequest = await ctx.httpRequest.render({ httpRequest, purpose });
    response = await ctx.httpRequest.send({ httpRequest: renderedHttpRequest });
  }

  return response;
}

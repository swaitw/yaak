import { CallTemplateFunctionArgs, Context, PluginDefinition } from '@yaakapp/api';

export const plugin: PluginDefinition = {
  templateFunctions: [
    {
      name: 'base64.encode',
      description: 'Encode a value to base64',
      args: [{ label: 'Plain Text', type: 'text', name: 'value', multiLine: true }],
      async onRender(_ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        return Buffer.from(args.values.value ?? '').toString('base64');
      },
    },
    {
      name: 'base64.decode',
      description: 'Decode a value from base64',
      args: [{ label: 'Encoded Value', type: 'text', name: 'value', multiLine: true }],
      async onRender(_ctx: Context, args: CallTemplateFunctionArgs): Promise<string | null> {
        return Buffer.from(args.values.value ?? '', 'base64').toString('utf-8');
      },
    },
  ],
};

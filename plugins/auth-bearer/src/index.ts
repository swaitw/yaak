import { PluginDefinition } from '@yaakapp/api';

export const plugin: PluginDefinition = {
  authentication: {
    name: 'Bearer',
    config: [{
      type: 'text',
      name: 'token',
      label: 'Token',
      optional: true,
    }],
    async onApply(_ctx: any, args: any): Promise<any> {
      const { token } = args.config;
      return {
        url: args.url,
        headers: [{
          name: 'Authorization',
          value: `Bearer ${token}`.trim(),
        }],
      };
    },
  },
};

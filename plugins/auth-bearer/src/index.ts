import { PluginDefinition } from '@yaakapp/api';

export const plugin: PluginDefinition = {
  authentication: {
    name: 'bearer',
    label: 'Bearer Token',
    shortLabel: 'Bearer',
    config: [{
      type: 'text',
      name: 'token',
      label: 'Token',
      optional: true,
      password: true,
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

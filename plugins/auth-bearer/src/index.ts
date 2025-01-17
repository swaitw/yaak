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
    async onApply(_ctx, args) {
      const { token } = args.config;
      const value = `Bearer ${token}`.trim();
      return { setHeaders: [{ name: 'Authorization', value }] };
    },
  },
};

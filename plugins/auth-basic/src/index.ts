import { PluginDefinition } from '@yaakapp/api';

export const plugin: PluginDefinition = {
  authentication: {
    name: 'basic',
    label: 'Basic Auth',
    shortLabel: 'Basic',
    config: [{
      type: 'text',
      name: 'username',
      label: 'Username',
      optional: true,
    }, {
      type: 'text',
      name: 'password',
      label: 'Password',
      optional: true,
      password: true,
    }],
    async onApply(_ctx, args) {
      const { username, password } = args.config;
      const value = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
      return { setHeaders: [{ name: 'Authorization', value }] };
    },
  },
};

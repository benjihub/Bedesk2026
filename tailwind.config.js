const plugin = require('tailwindcss/plugin');
const {
  sharedOverride,
  sharedExtend,
  sharedPlugins,
} = require('./common/foundation/resources/client/shared.tailwind');

module.exports = {
  content: [
    './resources/client/**/*.ts*',
    './common/foundation/resources/client/**/*.ts*',
    './common/helpdesk/resources/client/**/*.ts*',
    './modules/ai/resources/client/**/*.ts*',
    './modules/envato/resources/client/**/*.ts*',
    './modules/livechat/resources/client/**/*.ts*',
    './common/foundation/resources/views/install/**/*.blade.php',
    './common/foundation/resources/views/framework.blade.php',
  ],
  darkMode: 'class',
  theme: {
    ...sharedOverride,
    extend: {
      ...sharedExtend,
      boxShadow: {
        ...sharedExtend.boxShadow,
        'widget-popup':
          'rgba(0, 0, 0, 0.05) 0px 0.48px 2.41px -0.38px, rgba(0, 0, 0, 0.17) 0px 4px 20px -0.75px',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1146px',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), ...sharedPlugins(plugin)],
};

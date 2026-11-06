const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// withUniwindConfig must stay the outermost wrapper
module.exports = withUniwindConfig(config, {
  // relative path to the CSS entry file (from the project root)
  cssEntryFile: './src/global.css',
  // auto-generated TypeScript declarations for classNames/themes
  dtsFile: './src/uniwind-types.d.ts',
});

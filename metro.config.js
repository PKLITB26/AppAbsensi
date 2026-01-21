const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle React Native paths
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native/Libraries/Core/InitializeCore': path.resolve(
    __dirname,
    'node_modules/react-native/Libraries/Core/InitializeCore.js'
  ),
};

// Ensure proper file extensions are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx'];

// Add platforms
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;
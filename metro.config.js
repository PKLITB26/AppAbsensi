const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper file extensions are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx'];

// Add platforms
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Clear cache on start
config.resetCache = true;

// Set server host
config.server = {
  ...config.server,
  host: '192.168.1.8'
};

module.exports = config;
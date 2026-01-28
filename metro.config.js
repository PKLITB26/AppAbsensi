const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force IP address
config.server = {
  ...config.server,
  host: '10.231.107.181',
  port: 8081
};

module.exports = config;
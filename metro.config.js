const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Força o uso de JSC (desabilita Hermes)
config.transformer = {
  ...config.transformer,
  // sem minificação específica
};

config.server = {
  ...config.server,
  useHermes: false,
};

module.exports = config;
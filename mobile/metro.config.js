const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove NativeWind transformer - it's causing the issue
// We'll use the babel plugin only

module.exports = config;
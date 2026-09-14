const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const gestureHandlerEntry = path.resolve(
  __dirname,
  "node_modules/react-native-gesture-handler/lib/commonjs/index.js",
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-gesture-handler") {
    return { type: "sourceFile", filePath: gestureHandlerEntry };
  }

  if (typeof defaultResolveRequest === "function") {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Monorepo: watch the shared types package source so edits hot-reload.
const sharedPackageRoot = path.resolve(__dirname, "packages/shared");
config.watchFolders = [sharedPackageRoot];

const gestureHandlerEntry = path.resolve(
  __dirname,
  "node_modules/react-native-gesture-handler/lib/commonjs/index.js",
);

// Map '@aya/shared' straight to its TypeScript source (Metro transpiles it).
const sharedEntry = path.resolve(__dirname, "packages/shared/src/index.ts");

// Map '@aya/automator' to the local native module's TypeScript source.
const automatorEntry = path.resolve(__dirname, "modules/aya-automator/index.ts");

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-gesture-handler") {
    return { type: "sourceFile", filePath: gestureHandlerEntry };
  }

  if (moduleName === "@aya/automator") {
    return { type: "sourceFile", filePath: automatorEntry };
  }

  if (moduleName === "@aya/shared") {
    return { type: "sourceFile", filePath: sharedEntry };
  }

  // The shared package uses NodeNext-style "./foo.js" specifiers that point at
  // TypeScript sources. Metro doesn't rewrite those, so retry without the .js
  // extension and let Metro's sourceExts find the .ts/.tsx file.
  if (moduleName.startsWith(".") && moduleName.endsWith(".js")) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3), platform);
    } catch {
      // Fall through to the default resolution below.
    }
  }

  if (typeof defaultResolveRequest === "function") {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

import { getDefaultConfig } from "expo/metro-config.js";

const config = getDefaultConfig(import.meta.dirname);

const nativeOnly = /^@expo\/ui\/swift-ui(\/.*)?$/;

config.resolver.assetExts.push("wasm");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && nativeOnly.test(moduleName)) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

export default config;

import { createRequire } from "node:module";
import { defineConfig } from "hardhat/config";

const require = createRequire(import.meta.url);

export default defineConfig({
  solidity: {
    version: "0.8.30",
    path: require.resolve("solc/soljson.js"),
  },
});

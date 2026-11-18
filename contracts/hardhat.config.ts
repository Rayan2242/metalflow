import { createRequire } from "node:module";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import { configVariable, defineConfig } from "hardhat/config";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [hardhatEthers, hardhatNodeTestRunner],
  solidity: {
    version: "0.8.30",
    path: require.resolve("solc/soljson.js"),
  },
  networks: {
    arcTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 5042002,
      url: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
      accounts: [configVariable("ARC_DEPLOYER_PRIVATE_KEY")],
    },
  },
});

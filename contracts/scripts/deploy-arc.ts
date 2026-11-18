import { network } from "hardhat";
import { isAddress, ZeroAddress } from "ethers";

const arcTestnetChainId = 5042002n;
const usdc = "0x3600000000000000000000000000000000000000";
const marginValidator = process.env.ARC_MARGIN_VALIDATOR;

if (!marginValidator || !isAddress(marginValidator) || marginValidator === ZeroAddress) {
  throw new Error("Set ARC_MARGIN_VALIDATOR to a nonzero Ethereum address.");
}

const connection = await network.create();
try {
  const { ethers } = connection;
  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== arcTestnetChainId) {
    throw new Error(`Expected Arc Testnet (${arcTestnetChainId}), got chain ${chainId}.`);
  }

  const creditLine = await ethers.deployContract("MetalFlowCreditLine", [usdc, marginValidator]);
  const transaction = creditLine.deploymentTransaction();
  const receipt = await transaction?.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Could not confirm the MetalFlowCreditLine deployment.");
  }

  console.log(JSON.stringify({
    chainId: Number(chainId),
    address: await creditLine.getAddress(),
    blockNumber: receipt.blockNumber.toString(),
    transactionHash: receipt.hash,
    usdc,
    marginValidator,
  }, null, 2));
} finally {
  await connection.close();
}

import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import type { Contract, ContractTransactionResponse } from "ethers";
import { network } from "hardhat";

const lineId = 1n;
const marginCallId = 10n;
const twoUsdc = 2_000_000n;
const fiveUsdc = 5_000_000n;
const sevenUsdc = 7_000_000n;

async function expectEvent(
  contract: Contract,
  transaction: Promise<ContractTransactionResponse>,
  name: string,
  args: unknown[],
) {
  const receipt = await (await transaction).wait();
  assert.ok(receipt);
  const address = await contract.getAddress();
  const logs = receipt.logs
    .filter((log) => log.address === address)
    .map((log) => contract.interface.parseLog(log));
  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.name, name);
  assert.deepEqual(Array.from(logs[0]?.args ?? []), args);
}

async function expectState(creditLine: Contract, status: bigint, reserve: bigint, principal: bigint) {
  const line = await creditLine.creditLines(lineId);
  assert.equal(line.status, status);
  assert.equal(line.limitUsdc, sevenUsdc);
  assert.equal(line.availableReserveUsdc, reserve);
  assert.equal(line.outstandingPrincipalUsdc, principal);
}

async function deploy(t: TestContext) {
  const connection = await network.create();
  t.after(() => connection.close());
  const { ethers } = connection;
  const [lender, trader, validator, outsider] = await ethers.getSigners();
  const token = await ethers.deployContract("MockUsdc", [20_000_000n], lender);
  const credit = await ethers.deployContract("MetalFlowCreditLine", [token, validator.address], lender);
  const asTrader = await ethers.getContractAt("MetalFlowCreditLine", credit, trader);
  const asValidator = await ethers.getContractAt("MetalFlowCreditLine", credit, validator);
  const asOutsider = await ethers.getContractAt("MetalFlowCreditLine", credit, outsider);
  const traderToken = await ethers.getContractAt("MockUsdc", token, trader);
  return { credit, token, traderToken, asTrader, asValidator, asOutsider, lender, trader };
}

async function openLine(t: TestContext, reserve = sevenUsdc) {
  const fixture = await deploy(t);
  const { credit, token, asTrader, trader } = fixture;
  await credit.proposeCreditLine(trader.address, sevenUsdc);
  await asTrader.acceptCreditLine(lineId);
  if (reserve > 0n) {
    await token.approve(credit, reserve);
    await credit.depositReserve(lineId, reserve);
  }
  return fixture;
}

describe("MetalFlowCreditLine", () => {
  it("emits the shared events and moves USDC through the complete demo", async (t) => {
    const { credit, token, traderToken, asTrader, asValidator, lender, trader } = await deploy(t);

    await expectEvent(credit, credit.proposeCreditLine(trader.address, sevenUsdc),
      "CreditLineProposed", [lineId, lender.address, trader.address, sevenUsdc]);
    await expectState(credit, 1n, 0n, 0n);
    await expectEvent(credit, asTrader.acceptCreditLine(lineId), "CreditLineAccepted", [lineId]);
    await expectState(credit, 2n, 0n, 0n);

    await token.approve(credit, sevenUsdc);
    await expectEvent(credit, credit.depositReserve(lineId, sevenUsdc), "ReserveDeposited", [lineId, sevenUsdc]);
    await expectState(credit, 2n, sevenUsdc, 0n);
    assert.equal(await token.balanceOf(lender), 13_000_000n);
    assert.equal(await token.balanceOf(credit), sevenUsdc);

    await expectEvent(credit, asValidator.validateMarginCall(lineId, marginCallId),
      "MarginCallValidated", [lineId, marginCallId]);
    assert.equal(await credit.validatedMarginCalls(lineId, marginCallId), true);

    await expectEvent(credit, asTrader.drawCredit(lineId, marginCallId, twoUsdc),
      "CreditDrawn", [lineId, marginCallId, twoUsdc]);
    await expectState(credit, 2n, fiveUsdc, twoUsdc);
    assert.equal(await token.balanceOf(trader), twoUsdc);
    assert.equal(await token.balanceOf(credit), fiveUsdc);

    await traderToken.approve(credit, twoUsdc);
    await expectEvent(credit, asTrader.repayCredit(lineId, twoUsdc), "CreditRepaid", [lineId, twoUsdc]);
    await expectState(credit, 2n, sevenUsdc, 0n);
    assert.equal(await token.balanceOf(trader), 0n);
    assert.equal(await token.balanceOf(credit), sevenUsdc);
  });

  it("restricts acceptance, deposits, validation, draws and repayments to their roles", async (t) => {
    const { credit, asTrader, asOutsider, trader } = await deploy(t);
    await credit.proposeCreditLine(trader.address, sevenUsdc);
    await assert.rejects(credit.acceptCreditLine(lineId), /Unauthorized/);
    await assert.rejects(asOutsider.acceptCreditLine(lineId), /Unauthorized/);
    await asTrader.acceptCreditLine(lineId);

    await assert.rejects(asTrader.depositReserve(lineId, sevenUsdc), /Unauthorized/);
    await assert.rejects(credit.validateMarginCall(lineId, marginCallId), /Unauthorized/);
    await assert.rejects(asTrader.validateMarginCall(lineId, marginCallId), /Unauthorized/);
    await assert.rejects(asOutsider.drawCredit(lineId, marginCallId, twoUsdc), /Unauthorized/);
    await assert.rejects(asOutsider.repayCredit(lineId, twoUsdc), /Unauthorized/);
    await expectState(credit, 2n, 0n, 0n);
  });

  it("requires acceptance before funding, validation or drawing", async (t) => {
    const { credit, asTrader, asValidator, trader } = await deploy(t);
    await credit.proposeCreditLine(trader.address, sevenUsdc);
    await assert.rejects(credit.depositReserve(lineId, sevenUsdc), /InvalidLineStatus/);
    await assert.rejects(asValidator.validateMarginCall(lineId, marginCallId), /InvalidLineStatus/);
    await assert.rejects(asTrader.drawCredit(lineId, marginCallId, twoUsdc), /InvalidLineStatus/);
  });

  it("rejects draws without validation for that line and margin call", async (t) => {
    const { credit, token, asTrader, asValidator, trader } = await openLine(t);
    await assert.rejects(asTrader.drawCredit(lineId, marginCallId, twoUsdc), /MarginCallNotValidated/);
    await asValidator.validateMarginCall(lineId, marginCallId);
    await assert.rejects(asTrader.drawCredit(lineId, marginCallId + 1n, twoUsdc), /MarginCallNotValidated/);

    const otherLine = lineId + 1n;
    await credit.proposeCreditLine(trader.address, sevenUsdc);
    await asTrader.acceptCreditLine(otherLine);
    await token.approve(credit, sevenUsdc);
    await credit.depositReserve(otherLine, sevenUsdc);
    await assert.rejects(asTrader.drawCredit(otherLine, marginCallId, twoUsdc), /MarginCallNotValidated/);
  });

  it("rejects a draw above the available reserve", async (t) => {
    const { credit, asTrader, asValidator } = await openLine(t, 1_000_000n);
    await asValidator.validateMarginCall(lineId, marginCallId);
    await assert.rejects(asTrader.drawCredit(lineId, marginCallId, twoUsdc), /InsufficientReserve/);
    await expectState(credit, 2n, 1_000_000n, 0n);
  });

  it("checks the remaining credit limit even when the reserve can fund the draw", async (t) => {
    const { credit, asTrader, asValidator } = await openLine(t, 10_000_000n);
    await asValidator.validateMarginCall(lineId, marginCallId);
    await asTrader.drawCredit(lineId, marginCallId, twoUsdc);
    await assert.rejects(asTrader.drawCredit(lineId, marginCallId, fiveUsdc + 1n), /CreditLimitExceeded/);
    await expectState(credit, 2n, 8_000_000n, twoUsdc);
  });

  it("rejects repayments greater than the outstanding principal", async (t) => {
    const { credit, asTrader, asValidator, token, traderToken, trader } = await openLine(t);
    await asValidator.validateMarginCall(lineId, marginCallId);
    await asTrader.drawCredit(lineId, marginCallId, twoUsdc);
    await token.transfer(trader, 1n);
    await traderToken.approve(credit, twoUsdc + 1n);
    await assert.rejects(asTrader.repayCredit(lineId, twoUsdc + 1n), /ExcessiveRepayment/);
    await expectState(credit, 2n, fiveUsdc, twoUsdc);
    assert.equal(await token.balanceOf(trader), twoUsdc + 1n);
  });
});

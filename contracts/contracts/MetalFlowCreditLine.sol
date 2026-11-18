// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMetalFlowEvents} from "./IMetalFlowEvents.sol";

contract MetalFlowCreditLine is IMetalFlowEvents {
    using SafeERC20 for IERC20;

    struct CreditLine {
        address lender;
        address trader;
        CreditLineStatus status;
        uint256 limitUsdc;
        uint256 availableReserveUsdc;
        uint256 outstandingPrincipalUsdc;
    }

    error ZeroAddress();
    error ZeroAmount();
    error Unauthorized();
    error InvalidLineStatus();
    error InvalidMarginCallId();
    error MarginCallAlreadyValidated();
    error MarginCallNotValidated();
    error InsufficientReserve();
    error CreditLimitExceeded();
    error ExcessiveRepayment();

    IERC20 public immutable usdc;
    address public immutable marginValidator;
    uint256 public lineCount;
    mapping(uint256 lineId => CreditLine) public creditLines;
    mapping(uint256 lineId => mapping(uint256 marginCallId => bool)) public validatedMarginCalls;

    constructor(IERC20 usdc_, address marginValidator_) {
        if (address(usdc_) == address(0) || marginValidator_ == address(0)) revert ZeroAddress();
        usdc = usdc_;
        marginValidator = marginValidator_;
    }

    function proposeCreditLine(address trader, uint256 limitUsdc) external returns (uint256 lineId) {
        if (trader == address(0)) revert ZeroAddress();
        if (limitUsdc == 0) revert ZeroAmount();

        lineId = ++lineCount;
        creditLines[lineId] = CreditLine({
            lender: msg.sender,
            trader: trader,
            status: CreditLineStatus.Proposed,
            limitUsdc: limitUsdc,
            availableReserveUsdc: 0,
            outstandingPrincipalUsdc: 0
        });
        emit CreditLineProposed(lineId, msg.sender, trader, limitUsdc);
    }

    function acceptCreditLine(uint256 lineId) external {
        CreditLine storage line = creditLines[lineId];
        if (line.status != CreditLineStatus.Proposed) revert InvalidLineStatus();
        if (msg.sender != line.trader) revert Unauthorized();

        line.status = CreditLineStatus.Accepted;
        emit CreditLineAccepted(lineId);
    }

    function depositReserve(uint256 lineId, uint256 amountUsdc) external {
        CreditLine storage line = _acceptedLine(lineId);
        if (msg.sender != line.lender) revert Unauthorized();
        if (amountUsdc == 0) revert ZeroAmount();

        line.availableReserveUsdc += amountUsdc;
        usdc.safeTransferFrom(msg.sender, address(this), amountUsdc);
        emit ReserveDeposited(lineId, amountUsdc);
    }

    function validateMarginCall(uint256 lineId, uint256 marginCallId) external {
        if (msg.sender != marginValidator) revert Unauthorized();
        _acceptedLine(lineId);
        if (marginCallId == 0) revert InvalidMarginCallId();
        if (validatedMarginCalls[lineId][marginCallId]) revert MarginCallAlreadyValidated();

        validatedMarginCalls[lineId][marginCallId] = true;
        emit MarginCallValidated(lineId, marginCallId);
    }

    function drawCredit(uint256 lineId, uint256 marginCallId, uint256 amountUsdc) external {
        CreditLine storage line = _acceptedLine(lineId);
        if (msg.sender != line.trader) revert Unauthorized();
        if (amountUsdc == 0) revert ZeroAmount();
        if (!validatedMarginCalls[lineId][marginCallId]) revert MarginCallNotValidated();
        if (amountUsdc > line.availableReserveUsdc) revert InsufficientReserve();
        if (amountUsdc > line.limitUsdc - line.outstandingPrincipalUsdc) revert CreditLimitExceeded();

        line.availableReserveUsdc -= amountUsdc;
        line.outstandingPrincipalUsdc += amountUsdc;
        usdc.safeTransfer(msg.sender, amountUsdc);
        emit CreditDrawn(lineId, marginCallId, amountUsdc);
    }

    function repayCredit(uint256 lineId, uint256 amountUsdc) external {
        CreditLine storage line = _acceptedLine(lineId);
        if (msg.sender != line.trader) revert Unauthorized();
        if (amountUsdc == 0) revert ZeroAmount();
        if (amountUsdc > line.outstandingPrincipalUsdc) revert ExcessiveRepayment();

        line.outstandingPrincipalUsdc -= amountUsdc;
        line.availableReserveUsdc += amountUsdc;
        usdc.safeTransferFrom(msg.sender, address(this), amountUsdc);
        emit CreditRepaid(lineId, amountUsdc);
    }

    function _acceptedLine(uint256 lineId) private view returns (CreditLine storage line) {
        line = creditLines[lineId];
        if (line.status != CreditLineStatus.Accepted) revert InvalidLineStatus();
    }
}

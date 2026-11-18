// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

/// @notice Shared state and event schema for the MetalFlow demo.
interface IMetalFlowEvents {
    enum CreditLineStatus {
        None,
        Proposed,
        Accepted
    }

    event CreditLineProposed(
        uint256 indexed lineId,
        address indexed lender,
        address indexed trader,
        uint256 limitUsdc
    );

    event CreditLineAccepted(uint256 indexed lineId);
    event ReserveDeposited(uint256 indexed lineId, uint256 amountUsdc);
    event MarginCallValidated(uint256 indexed lineId, uint256 indexed marginCallId, uint256 maxAmountUsdc);

    event ReserveFundedViaCctp(
        uint256 indexed lineId,
        bytes32 indexed messageHash,
        uint256 netAmountUsdc
    );

    event CreditDrawn(
        uint256 indexed lineId,
        uint256 indexed marginCallId,
        uint256 amountUsdc
    );

    event CreditRepaid(uint256 indexed lineId, uint256 amountUsdc);
}

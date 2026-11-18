// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUsdc is ERC20 {
    constructor(uint256 supply) ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, supply);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

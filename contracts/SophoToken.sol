// SPDX-License-Identifier: MIT
// ^ Every Solidity file needs a license. MIT = open source, anyone can use it.

pragma solidity ^0.8.24;
// ^ Tells the compiler which Solidity version to use. Must match hardhat.config.

// We import two battle-tested OpenZeppelin contracts instead of writing from scratch:
// - ERC20: The standard fungible token implementation (balances, transfers, approvals)
// - Ownable: Adds an "owner" who has special permissions (like minting)
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SophoToken (SPH)
/// @notice A simple ERC-20 stablecoin for the e-commerce platform
contract SophoToken is ERC20, Ownable {
    // "is ERC20, Ownable" = SophoToken INHERITS all functions from both.
    // This gives us transfer(), balanceOf(), approve(), etc. for FREE.

    // --- Events ---
    // Events are like logs. They don't cost storage, but frontends can listen for them.
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /// @notice Deploy the token. The deployer becomes the owner.
    /// @dev ERC20("Sopho", "SPH") sets the token name and symbol.
    ///      Ownable(msg.sender) makes the deployer the owner.
    constructor() ERC20("Sopho", "SPH") Ownable(msg.sender) {
        // Mint 1,000,000 SPH to the deployer (you) as initial supply.
        // Why 10**decimals()? ERC-20 tokens use 18 decimal places by default.
        // So "1 SPH" is actually stored as 1_000_000_000_000_000_000 (1e18).
        // This is like how $1.00 is stored as 100 cents, but with 18 places.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Owner can mint new tokens to any address.
    /// @dev This is how you'll "sell" SPH: customer pays via Stripe/ETH,
    ///      you call mint() to send them SPH tokens.
    /// @param to   The wallet address receiving the tokens
    /// @param amount The number of tokens (in wei, so 1 SPH = 1e18)
    function mint(address to, uint256 amount) external onlyOwner {
        // onlyOwner = only your wallet can call this. Anyone else gets rejected.
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /// @notice Any holder can burn their own tokens.
    /// @dev Useful for redemption: customer burns SPH to "cash out".
    /// @param amount The number of tokens to burn
    function burn(uint256 amount) external {
        // _burn reduces the caller's balance AND the total supply.
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
}

// --- What you get from ERC20 (inherited, no code needed): ---
//
// balanceOf(address)          → Check any wallet's SPH balance
// transfer(to, amount)        → Send SPH from your wallet to another
// approve(spender, amount)    → Allow another contract (like Escrow) to spend your SPH
// transferFrom(from, to, amt) → The approved contract moves tokens on your behalf
// totalSupply()               → How many SPH exist in total
// name()                      → "Sopho"
// symbol()                    → "SPH"
// decimals()                  → 18

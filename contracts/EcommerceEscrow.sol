// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EcommerceEscrow {
    enum EscrowState { Created, Funded, Released, Disputed, Refunded }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        uint256 usdAmount;
        EscrowState state;
        uint256 createdAt;
        uint256 releaseDeadline;
        string orderId;
    }

    address public owner;
    address public arbiter;
    uint256 public escrowCount;
    uint256 public releaseTimeout = 14 days;

    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, address buyer, uint256 amount, string orderId);
    event EscrowReleased(uint256 indexed escrowId);
    event EscrowRefunded(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId);

    modifier onlyBuyer(uint256 _escrowId) {
        require(msg.sender == escrows[_escrowId].buyer, "Not buyer");
        _;
    }

    modifier onlyOwnerOrArbiter() {
        require(msg.sender == owner || msg.sender == arbiter, "Not authorized");
        _;
    }

    constructor(address _arbiter) {
        owner = msg.sender;
        arbiter = _arbiter;
    }

    /// @notice Create and fund an escrow in one transaction
    function createEscrow(string calldata _orderId) external payable returns (uint256) {
        require(msg.value > 0, "Must send ETH");

        uint256 escrowId = escrowCount++;

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: owner,
            amount: msg.value,
            usdAmount: 0,
            state: EscrowState.Funded,
            createdAt: block.timestamp,
            releaseDeadline: block.timestamp + releaseTimeout,
            orderId: _orderId
        });

        emit EscrowCreated(escrowId, msg.sender, msg.value, _orderId);
        return escrowId;
    }

    /// @notice Buyer confirms delivery, releasing funds to seller
    function confirmDelivery(uint256 _escrowId) external onlyBuyer(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Funded, "Not funded");

        escrow.state = EscrowState.Released;
        payable(escrow.seller).transfer(escrow.amount);

        emit EscrowReleased(_escrowId);
    }

    /// @notice Auto-release after timeout (anyone can call after deadline)
    function autoRelease(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Funded, "Not funded");
        require(block.timestamp >= escrow.releaseDeadline, "Too early");

        escrow.state = EscrowState.Released;
        payable(escrow.seller).transfer(escrow.amount);

        emit EscrowReleased(_escrowId);
    }

    /// @notice Buyer raises a dispute
    function dispute(uint256 _escrowId) external onlyBuyer(_escrowId) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Funded, "Not funded");

        escrow.state = EscrowState.Disputed;
        emit EscrowDisputed(_escrowId);
    }

    /// @notice Arbiter resolves dispute with refund to buyer
    function refund(uint256 _escrowId) external onlyOwnerOrArbiter {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.state == EscrowState.Funded ||
            escrow.state == EscrowState.Disputed,
            "Cannot refund"
        );

        escrow.state = EscrowState.Refunded;
        payable(escrow.buyer).transfer(escrow.amount);

        emit EscrowRefunded(_escrowId);
    }
}

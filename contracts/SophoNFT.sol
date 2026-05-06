// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ERC721URIStorage: NFT standard + per-token metadata URI (points to JSON with image, name, etc.)
// Ownable: Only you (the store) can mint NFTs
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SophoNFT
/// @notice Multi-purpose NFTs for the e-commerce platform:
///         - Purchase receipts
///         - Product authenticity certificates
///         - Loyalty membership tiers
contract SophoNFT is ERC721URIStorage, Ownable {

    // ============ State ============

    // Counter for unique token IDs (each NFT gets the next number)
    uint256 private _nextTokenId;

    // NFT categories — what kind of NFT is this?
    enum NFTType { Receipt, Authenticity, Loyalty }

    // Data stored on-chain for each NFT
    struct NFTData {
        NFTType nftType;      // What kind of NFT
        string orderId;       // Linked order ID (for receipts)
        string productId;     // Linked product ID (for authenticity)
        uint8 loyaltyTier;    // 0=none, 1=Bronze, 2=Silver, 3=Gold (for loyalty)
        uint256 mintedAt;     // When it was created
    }

    // tokenId => NFT data
    mapping(uint256 => NFTData) public nftData;

    // Track loyalty NFTs per address (one per tier max)
    mapping(address => uint256) public loyaltyTokenOf;

    // ============ Events ============

    event ReceiptMinted(uint256 indexed tokenId, address indexed buyer, string orderId);
    event AuthenticityMinted(uint256 indexed tokenId, address indexed buyer, string productId);
    event LoyaltyMinted(uint256 indexed tokenId, address indexed holder, uint8 tier);
    event LoyaltyUpgraded(uint256 indexed tokenId, uint8 oldTier, uint8 newTier);

    // ============ Constructor ============

    /// @dev Sets the NFT collection name and symbol.
    ///      "Sopho NFT" will appear as the collection name on OpenSea, etc.
    constructor() ERC721("Sopho NFT", "SNFT") Ownable(msg.sender) {}

    // ============ Mint Functions ============

    /// @notice Mint a purchase receipt NFT to the buyer.
    /// @param to       The buyer's wallet address
    /// @param orderId  The order ID from your database
    /// @param tokenURI IPFS/HTTP link to the metadata JSON
    /// @return tokenId The ID of the minted NFT
    function mintReceipt(
        address to,
        string calldata orderId,
        string calldata tokenURI
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        nftData[tokenId] = NFTData({
            nftType: NFTType.Receipt,
            orderId: orderId,
            productId: "",
            loyaltyTier: 0,
            mintedAt: block.timestamp
        });

        emit ReceiptMinted(tokenId, to, orderId);
        return tokenId;
    }

    /// @notice Mint a product authenticity certificate NFT.
    /// @param to        The buyer's wallet address
    /// @param productId The product ID from your database
    /// @param tokenURI  IPFS/HTTP link to the metadata JSON
    /// @return tokenId  The ID of the minted NFT
    function mintAuthenticity(
        address to,
        string calldata productId,
        string calldata tokenURI
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        nftData[tokenId] = NFTData({
            nftType: NFTType.Authenticity,
            orderId: "",
            productId: productId,
            loyaltyTier: 0,
            mintedAt: block.timestamp
        });

        emit AuthenticityMinted(tokenId, to, productId);
        return tokenId;
    }

    /// @notice Mint or upgrade a loyalty membership NFT.
    /// @dev Each address can only have one loyalty NFT. Calling again upgrades the tier.
    /// @param to       The member's wallet address
    /// @param tier     1=Bronze, 2=Silver, 3=Gold
    /// @param tokenURI IPFS/HTTP link to the tier metadata JSON
    /// @return tokenId The ID of the loyalty NFT
    function mintOrUpgradeLoyalty(
        address to,
        uint8 tier,
        string calldata tokenURI
    ) external onlyOwner returns (uint256) {
        require(tier >= 1 && tier <= 3, "Invalid tier: 1=Bronze, 2=Silver, 3=Gold");

        uint256 existingTokenId = loyaltyTokenOf[to];

        // If they already have a loyalty NFT, upgrade it
        if (existingTokenId != 0 || (existingTokenId == 0 && _ownerOf(0) == to)) {
            // Check if token actually exists and belongs to this user
            if (_ownerOf(existingTokenId) == to) {
                uint8 oldTier = nftData[existingTokenId].loyaltyTier;
                require(tier > oldTier, "Can only upgrade tier, not downgrade");

                nftData[existingTokenId].loyaltyTier = tier;
                _setTokenURI(existingTokenId, tokenURI);

                emit LoyaltyUpgraded(existingTokenId, oldTier, tier);
                return existingTokenId;
            }
        }

        // Mint new loyalty NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        nftData[tokenId] = NFTData({
            nftType: NFTType.Loyalty,
            orderId: "",
            productId: "",
            loyaltyTier: tier,
            mintedAt: block.timestamp
        });

        loyaltyTokenOf[to] = tokenId;

        emit LoyaltyMinted(tokenId, to, tier);
        return tokenId;
    }

    // ============ View Functions ============

    /// @notice Get the total number of NFTs minted
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Check someone's loyalty tier (0 = no membership)
    function getLoyaltyTier(address holder) external view returns (uint8) {
        uint256 tokenId = loyaltyTokenOf[holder];
        if (_ownerOf(tokenId) != holder) return 0;
        return nftData[tokenId].loyaltyTier;
    }
}

// This script deploys your SophoToken to the blockchain.
// Run it with: npx hardhat run scripts/deploy-sopho.cjs --network sepolia --config hardhat.config.cjs

/* eslint-disable @typescript-eslint/no-require-imports */
const hre = require("hardhat");

async function main() {
  // Get the deployer's wallet (the first account from your private key)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SophoToken with account:", deployer.address);

  // Check deployer's ETH balance (you need ETH to pay gas fees for deployment)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  // This does 3 things:
  // 1. Sends the compiled bytecode to the blockchain
  // 2. Runs the constructor() (which mints 1M SPH to your wallet)
  // 3. Returns the contract instance with its new address
  const SophoToken = await hre.ethers.getContractFactory("SophoToken");
  const sophoToken = await SophoToken.deploy();

  // Wait for the transaction to be confirmed (mined into a block)
  await sophoToken.waitForDeployment();

  const address = await sophoToken.getAddress();
  console.log("\n=================================");
  console.log("SophoToken deployed to:", address);
  console.log("=================================");
  console.log("\nNext steps:");
  console.log("1. Add to .env.local:  NEXT_PUBLIC_SOPHO_TOKEN_ADDRESS=" + address);
  console.log("2. Verify on Etherscan: npx hardhat verify --network sepolia", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

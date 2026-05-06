/* eslint-disable @typescript-eslint/no-require-imports */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SophoNFT with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const SophoNFT = await hre.ethers.getContractFactory("SophoNFT");
  const sophoNFT = await SophoNFT.deploy();
  await sophoNFT.waitForDeployment();

  const address = await sophoNFT.getAddress();
  console.log("\n=================================");
  console.log("SophoNFT deployed to:", address);
  console.log("=================================");
  console.log("\nAdd to .env.local:  NEXT_PUBLIC_SOPHO_NFT_ADDRESS=" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

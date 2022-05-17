const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  // Whitelist contract address
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // URL to get metadata for Crypto Dev NFT
  const metadataURL = METADATA_URL;
  // Factory for instances of our CryptoDevs contract
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  // deploy contract
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  // print the address of the deployed contract
  console.log(
    "Crypto Devs Contract Address",
    deployedCryptoDevsContract.address
  );
}

// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

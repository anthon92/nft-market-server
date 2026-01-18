/**
 * Hardhat Configuration (Blockchain Development)
 * This file is REQUIRED by Hardhat framework
 */

require("@nomiclabs/hardhat-waffle");
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');

// Read private key from .secret file (fallback method)
let privateKey = "";
try {
  if (fs.existsSync(".secret")) {
    privateKey = fs.readFileSync(".secret").toString().trim();
  }
} catch (err) {
  console.warn("No .secret file found, using environment variable");
}

// Use environment variable or file
privateKey = process.env.PRIVATE_KEY || privateKey || "0x0000000000000000000000000000000000000000000000000000000000000000";

// Get Infura ID from environment
const infuraId = process.env.NEXT_PUBLIC_INFURA_ID || "";

if (!infuraId) {
  console.warn("⚠️  NEXT_PUBLIC_INFURA_ID not set in .env.local");
}

module.exports = {
  defaultNetwork: "hardhat",
  
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337
    },
    
    // Polygon Mumbai Testnet
    mumbai: {
      url: infuraId 
        ? `https://polygon-mumbai.infura.io/v3/${infuraId}`
        : "https://rpc-mumbai.maticvigil.com",
      accounts: privateKey ? [privateKey] : [],
      chainId: 80001
    },
    
    // Polygon Mainnet (Production)
    polygon: {
      url: infuraId
        ? `https://polygon-mainnet.infura.io/v3/${infuraId}`
        : "https://polygon-rpc.com",
      accounts: privateKey ? [privateKey] : [],
      chainId: 137
    }
  },
  
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};


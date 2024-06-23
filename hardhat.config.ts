import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades'
import * as dotenv from 'dotenv'
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: Boolean(process.env.REPORT_GAS) || true,
  },

  sourcify: {
    enabled: true,
  },

  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
  }, 

  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
};

export default config;

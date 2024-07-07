import { ethers, run, upgrades } from "hardhat";

async function main() {
  run("compile");
  console.log("compile contract...");

  const owner = new ethers.Wallet(
    process.env.DEPLOYER_PRIVATE_KEY || "",
    ethers.provider
  );

  const proxyAddr = "0xD568e9628dD89AE8F455171E244Ef746B429318b";

  console.log("Deploy contract...");
  const BeatWave = await ethers.getContractFactory('BeatWave');
  const beatWave = await upgrades.upgradeProxy(
    proxyAddr,
    BeatWave.connect(owner)
  );

  await beatWave.waitForDeployment();

  console.log("Wait to verify contract logic");
  await new Promise((resolve) => {
    setTimeout(resolve, 60 * 1000);
  });

  const iplmAddr = await upgrades.erc1967.getImplementationAddress(proxyAddr);

  await run("verify:verify", {
    address: iplmAddr,
    constructorArgs: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//proxy address: 0xD568e9628dD89AE8F455171E244Ef746B429318b

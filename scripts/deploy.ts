import { ethers, run, upgrades } from "hardhat";

async function main() {
  run("compile");
  console.log("compile contract...");

  const constructorArgs: [string] = [
    "0xBac2B69C092d8F9D5A102D1762a197A90947DCbB",
  ];

  console.log("Deploy contract...");
  const BeatWave = await ethers.getContractFactory("BeatWave");
  const beatWave = await upgrades.deployProxy(BeatWave, constructorArgs, {
    kind: "uups",
    initializer: "initialize",
  });

  await beatWave.waitForDeployment();

  const proxyAddr = await beatWave.getAddress();
  console.log("Address contract proxy is: ", proxyAddr);

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
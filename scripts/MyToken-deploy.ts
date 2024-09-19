import { ethers, run } from "hardhat";

async function main() {
  // compile the contract
  await run("compile");
  // deploy the contract
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();

  await myToken.waitForDeployment();

  const prxAddr = await myToken.getAddress();
  console.log("MyToken deployed to:", prxAddr);
  //await time
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

  //verify the contract
  await run("verify:verify", {
    address: prxAddr,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

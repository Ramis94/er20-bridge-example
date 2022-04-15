import { task } from "hardhat/config";

task("swap")
  .addParam("contract")
  .addParam("token")
  .addParam("to")
  .addParam("amount")
  .addParam("fromnetwork")
  .addParam("tonetwork")
  .addParam("nonce")
  .setAction(async (taskArgs, hre) => {
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);
    const contract = await hre.ethers.getContractAt(
      "Bridge",
      taskArgs.contract
    );
    const result = await contract.swap(
      taskArgs.token,
      taskArgs.to,
      amount,
      taskArgs.fromnetwork,
      taskArgs.tonetwork,
      taskArgs.nonce
    );
    console.log("result: " + (await result.wait()));
  });

import { task } from "hardhat/config";

task("redeem")
  .addParam("contract")
  .addParam("token")
  .addParam("amount")
  .addParam("fromNetwork")
  .addParam("toNetwork")
  .addParam("nonce")
  .setAction(async (taskArgs, hre) => {
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);
    const contract = await hre.ethers.getContractAt(
      "Bridge",
      taskArgs.contract
    );
    const result = await contract.redeem(
      taskArgs.token,
      amount,
      taskArgs.fromNetwork,
      taskArgs.toNetwork,
      taskArgs.nonce
    );
      console.log("result: " + result);
  });

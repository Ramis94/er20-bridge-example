import { task } from "hardhat/config";
import { ethers, web3 } from "hardhat";

task("redeem")
  .addParam("contract")
  .addParam("validator")
  .addParam("token")
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

    const msg = await hre.web3.utils.soliditySha3(
      taskArgs.token,
      amount.toString(),
      taskArgs.fromnetwork,
      taskArgs.tonetwork,
      taskArgs.nonce
    );
    if (msg == null) {
      throw Error("msg is null");
    }
    const signature = await hre.web3.eth.sign(msg, taskArgs.validator);
    const sig = await hre.ethers.utils.splitSignature(signature);

    const result = await contract.redeem(
      taskArgs.token,
      amount,
      taskArgs.fromnetwork,
      taskArgs.tonetwork,
      taskArgs.nonce,
      sig.v,
      sig.r,
      sig.s
    );
    console.log("result: " + (await result.wait()));
  });

import { expect } from "chai";
import { ethers, web3 } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Bridge, Bridge__factory, MyERC20__factory, MyERC20 } from "../typechain";

describe("Bridge", function() {
  let bridgeFirst: Bridge;
  let bridgeSecond: Bridge;
  let tokenFirst: MyERC20;
  let tokenSecond: MyERC20;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();

    const bridgeFactory = (await ethers.getContractFactory(
      "Bridge",
      owner
    )) as Bridge__factory;
    bridgeFirst = await bridgeFactory.deploy(owner.address);
    await bridgeFirst.deployed;
    bridgeSecond = await bridgeFactory.deploy(owner.address);
    await bridgeSecond.deployed;

    const tokenFactory = (await ethers.getContractFactory(
      "MyERC20",
      owner
    )) as MyERC20__factory;
    tokenFirst = await tokenFactory.deploy("TokenFirst", "TF");
    await tokenFirst.deployed;
    tokenSecond = await tokenFactory.deploy("TokenSecond", "TS");
    await tokenSecond.deployed;

    Promise.all([
      tokenFirst.mint(addr1.address, ethers.utils.parseEther("12"))
    ]);
  });

  it("swap", async function() {
    await expect(
      bridgeFirst
        .connect(addr1)
        .swap(tokenFirst.address, addr2.address, ethers.utils.parseEther("0.5"), "First", "Second", 1)
    )
      .to.emit(bridgeFirst, "SwapInitialized")
      .withArgs(
        tokenFirst.address,
        ethers.utils.parseEther("0.5"),
        addr1.address,
        addr2.address,
        "First",
        "Second",
        1
      );
  });

  it("redeem", async function() {
    const msg = await web3.utils.soliditySha3(
      tokenSecond.address,
      ethers.utils.parseEther("0.5").toString(),
      "First",
      "Second",
      1
    );
    if (msg == null) {
      throw Error("msg is null");
    }
    const signature = await web3.eth.sign(msg, owner.address);
    const sig = await ethers.utils.splitSignature(signature);
    await expect(
      await bridgeSecond
        .connect(addr2)
        .redeem(
          tokenSecond.address,
          ethers.utils.parseEther("0.5"),
          "First",
          "Second",
          1,
          sig.v,
          sig.r,
          sig.s
        )
    )
      .to.emit(bridgeSecond, "Redeemed")
      .withArgs(
        tokenSecond.address,
        ethers.utils.parseEther("0.5"),
        "First",
        "Second",
        msg
      );
    await expect(
      bridgeSecond
        .connect(addr2)
        .redeem(
          tokenSecond.address,
          ethers.utils.parseEther("0.5"),
          "First",
          "Second",
          1,
          sig.v,
          sig.r,
          sig.s
        )
    ).to.be.revertedWith("Bridge: error redeem again");
  });

  it("should signer not equal validator", async function() {
    const msg = await web3.utils.soliditySha3(
      tokenSecond.address,
      ethers.utils.parseEther("0.5").toString(),
      "First",
      "Second",
      1
    );
    if (msg == null) {
      throw Error("msg is null");
    }
    const signature = await web3.eth.sign(msg, addr1.address);
    const sig = await ethers.utils.splitSignature(signature);
    await expect(
      bridgeSecond
        .connect(addr2)
        .redeem(
          tokenSecond.address,
          ethers.utils.parseEther("0.5"),
          "First",
          "Second",
          1,
          sig.v,
          sig.r,
          sig.s
        )
    ).to.be.revertedWith("Bridge: signer not equal validator");
  });
});

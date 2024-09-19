// test mytoken erc20
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("MyToken contract", () => {
  async function deployMyTokenContract() {
    const [acc1, acc2, acc3] = await ethers.getSigners();
    const myToken = await ethers.deployContract("MyToken");
    return { myToken, acc1, acc2, acc3 };
  }
  describe("Test function transfer", () => {
    it("Should allow transfering tokens", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.transfer(acc2.address, 100);
      const balance = await myToken.balanceOf(acc2.address);
      expect(balance).to.equal(100);
    });
  });
  describe("Test function approve", () => {
    it("Should allow approving tokens", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.approve(acc2.address, 100);
      const allowance = await myToken.allowance(acc1.address, acc2.address);
      expect(allowance).to.equal(100);
    });
  });
  describe("Test function transferFrom", () => {
    it("Should allow transfering tokens from", async () => {
      const { myToken, acc1, acc2, acc3 } = await loadFixture(deployMyTokenContract);
      await myToken.approve(acc2.address, 100);
      await myToken.connect(acc2).transferFrom(acc1.address, acc3.address, 100);
      const balance = await myToken.balanceOf(acc3.address);
      // console.log(balance);
      expect(balance).to.equal(100);
    });
  });
  describe("Test function mint", () => {
    it("Should allow minting tokens", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.mint(acc2.address, 100);
      const balance = await myToken.balanceOf(acc2.address);
      expect(balance).to.equal(100);
    });
  });
  describe("Test function burn", () => {
    it("Should allow burning tokens", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.mint(acc2.address, 100);
      await myToken.burn(acc2.address, 100);
      const balance = await myToken.balanceOf(acc2.address);
      // console.log(balance);
      expect(balance).to.equal(0);
    });
  });
  describe("Test function totalSupply", () => {
    it("Should return total supply", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      const totalSupplyPre = await myToken.totalSupply();
      await myToken.mint(acc1.address, 100);
      const totalSupply = await myToken.totalSupply();
      const result = totalSupply - (totalSupplyPre);
      // console.log(result);
      expect(result).to.equal(100);
    });
  });
  describe("Test function balanceOf", () => {
    it("Should return balance", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.mint(acc2.address, 100);
      const balance = await myToken.balanceOf(acc2.address);
      expect(balance).to.equal(100);
    });
  });
  describe("Test function allowance", () => {
    it("Should return allowance", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.approve(acc2.address, 100);
      const allowance = await myToken.allowance(acc1.address, acc2.address);
      expect(allowance).to.equal(100);
    });
  });
  describe("Test function name", () => {
    it("Should return name", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      const name = await myToken.name();
      expect(name).to.equal("MyToken");
    });
  });
  describe("Test function symbol", () => {
    it("Should return symbol", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      const symbol = await myToken.symbol();
      expect(symbol).to.equal("MTK");
    });
  });
  describe("Test function decimals", () => {
    it("Should return decimals", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      const decimals = await myToken.decimals();
      expect(decimals).to.equal(18);
    });
  });
  describe("Test function owner", () => {
    it("Should return owner", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      const owner = await myToken.owner();
      expect(owner).to.equal(acc1.address);
    });
  });
  describe("Test function transferOwnership", () => {
    it("Should allow transfering ownership", async () => {
      const { myToken, acc1, acc2 } = await loadFixture(deployMyTokenContract);
      await myToken.transferOwnership(acc2.address);
      const owner = await myToken.owner();
      expect(owner).to.equal(acc2.address);
    });
  });
});

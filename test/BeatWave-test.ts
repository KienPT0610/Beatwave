import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("BeatWave contract", () => {
  async function deployBeatWaveContract() {
    const [acc1, acc2] = await ethers.getSigners();
    const beatWave = await ethers.deployContract("BeatWave");

    return { beatWave, acc1, acc2 };
  }

  describe("Test function uploadBeat", () => {
    it("Should allow uploading a beat", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));
      const beat = await beatWave.beats(1);

      expect(beat.owner).to.equals(acc1.address);
      expect(beat.cid).to.equal("cid123");
      expect(beat.title).to.equal("My beat");
      expect(beat.price).to.equal(ethers.parseEther("1"));
    });

    it("Should emit BeatUploaded event", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await expect(
        beatWave.uploadBeat("cid123", "My beat", ethers.parseEther("1"))
      )
        .to.emit(beatWave, "BeatUpLoaded")
        .withArgs(
          1,
          acc1.address,
          "cid123",
          "My beat",
          ethers.parseEther("1.0")
        );
    });
  });

  describe("Test function deleteBeat", () => {
    it("Should delete beat is for sale if is owner", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.connect(acc1).listBeatForSale(1, ethers.parseEther("1.5"));
      await beatWave.deleteBeatForSale(1);
      const beat = await beatWave.beats(1);

      expect(beat.isForSale).to.equal(false);
    });

    it("Should delete beat is for sale if is not owner", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.connect(acc1).listBeatForSale(1, ethers.parseEther("1.5"));
      expect(beatWave.connect(acc2).deleteBeatForSale(1)).to.be.rejectedWith(
        "You are not the owner of this beat"
      );
    });
  });

  describe("Test function sale and buy", () => {
    it("Should list a beat for sale", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.listBeatForSale(1, ethers.parseEther("1.5"));

      const beat = await beatWave.beats(1);
      expect(beat.isForSale).to.equals(true);
      expect(beat.price).to.equal(ethers.parseEther("1.5"));
    });

    it("Should emit event for list a beat for sale", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      expect(beatWave.listBeatForSale(1, ethers.parseEther("1.5")))
        .to.emit(beatWave, "BeatListForSale")
        .withArgs(1, acc1.address, ethers.parseEther("1.5"));
    });

    it("Should buy beat if value is true", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.listBeatForSale(1, ethers.parseEther("1.5"));

      await beatWave
        .connect(acc2)
        .buyBeat(1, { value: ethers.parseEther("1.5") });

      const beat = await beatWave.beats(1);
      expect(beat.owner).to.equal(acc2.address);
      expect(beat.isForSale).to.equal(false);
    });

    it("Should buy beat if value is incorrect", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.listBeatForSale(1, ethers.parseEther("1.5"));

      expect(
        beatWave.connect(acc2).buyBeat(1, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Incorrect Price");
    });

    it("Should emit event for buy beat", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.listBeatForSale(1, ethers.parseEther("1.5"));

      expect(
        beatWave.connect(acc2).buyBeat(1, { value: ethers.parseEther("1.5") })
      )
        .to.emit(beatWave, "BeatSold")
        .withArgs(1, acc1.address, acc2.address, ethers.parseEther("1.5"));
    });
  });

  describe("Test function like and transfer owner beat", () => {
    it("Should like a beat", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave.uploadBeat("cid123", "My beat", ethers.parseEther("1"));
      await beatWave.listBeatForSale(1, ethers.parseEther("1.5"));
      await beatWave.likeBeat(1, false);
      await beatWave.connect(acc2).likeBeat(1, false);

      const beat = await beatWave.beats(1);

      expect(beat.numberOfLikes).to.equal(2);
    });

    it("should transfer owner if is owner", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await beatWave.transferOwner(1, acc2);
      const beat = await beatWave.beats(1);

      expect(beat.owner).to.equal(acc2.address);
    });

    it("should transfer owner if is not owner", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      expect(beatWave.connect(acc2).transferOwner(1, acc2)).to.be.revertedWith(
        "You are not the owner of this beat"
      );
    });

    it("should emit event transfer", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat", ethers.parseEther("1"));

      await expect(beatWave.transferOwner(1, acc2))
        .to.emit(beatWave, "Transfer")
        .withArgs(1, acc1.address, acc2.address);
    });
  });
});

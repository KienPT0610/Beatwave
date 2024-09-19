import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

const addressNull = "0x0000000000000000000000000000000000000000";

describe("BeatWave contract", () => {
  async function deployBeatWaveContract() {
    const [acc1, acc2] = await ethers.getSigners();
    const beatWave = await ethers.deployContract("BeatWave");

    return { beatWave, acc1, acc2 };
  }

  describe("Test function name and symbol", () => {
    it("Should return the correct name", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);
      await beatWave.initialize(acc1.address);
      expect(await beatWave.name()).to.equal("Beatwave");
    });

    it("Should return the correct symbol", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);
      await beatWave.initialize(acc1.address);
      expect(await beatWave.symbol()).to.equal("BW");
    });
  });

  describe("Test function mint", () => {
    it("Should mint tokens", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(deployBeatWaveContract);
      await beatWave.initialize(acc1.address);

      await beatWave.mint(acc2.address, 1000);
      const balance = await beatWave.balanceOf(acc2.address);

      expect(balance).to.equal(1000);
    });

    it("Should emit event Mint", async () => {
      const { beatWave, acc2 } = await loadFixture(deployBeatWaveContract);

      expect(beatWave.mint(acc2.address, 1000))
        .to.emit(beatWave, "Mint")
        .withArgs(acc2.address, 1000);
    });
  });

  describe("Test function transfer", () => {
    it("Should transfer tokens", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(deployBeatWaveContract);
      await beatWave.initialize(acc1.address);
      await beatWave.transfer(acc2.address, 500);
      const balanceAcc2 = await beatWave.balanceOf(acc2.address);

      expect(balanceAcc2).to.equal(500);
    });

    it("Should emit event Transfer", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(deployBeatWaveContract);

      expect(beatWave.transfer(acc2.address, 500))
        .to.emit(beatWave, "Transfer")
        .withArgs(acc1.address, acc2.address, 500);
    });
  });

  describe("Test function uploadBeat", () => {
    it("Should allow uploading a beat", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat");
      const beat = await beatWave.beats(1);

      expect(beat.owner).to.equals(acc1.address);
      expect(beat.cid).to.equal("cid123");
      expect(beat.title).to.equal("My beat");
      expect(beat.price).to.equal(0);
    });

    it("Should emit BeatUploaded event", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await expect(
        beatWave.uploadBeat("cid123", "My beat")
      )
        .to.emit(beatWave, "BeatUpLoaded")
        .withArgs(
          1,
          acc1.address,
          "cid123",
          "My beat",
          0
        );
    });
  });

  describe("Test function deleteBeat", () => {
    it("Should delete beat is for sale if is owner", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat");

      await beatWave.connect(acc1).listBeatForSale(1, 1000);
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
        .uploadBeat("cid123", "My beat");

      await beatWave.connect(acc1).listBeatForSale(1, 1000);
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
        .uploadBeat("cid123", "My beat");

      await beatWave.listBeatForSale(1, 1000);

      const beat = await beatWave.beats(1);
      expect(beat.isForSale).to.equals(true);
      expect(beat.price).to.equal(1000);
    });

    it("Should emit event for list a beat for sale", async () => {
      const { beatWave, acc1 } = await loadFixture(deployBeatWaveContract);

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat");

      expect(beatWave.listBeatForSale(1, 1000))
        .to.emit(beatWave, "BeatListForSale")
        .withArgs(1, acc1.address, 1000);
    });

    it("Should buy beat if value is true", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.initialize(acc1.address);

      await beatWave.mint(acc2.address, 1000);
      await beatWave.uploadBeat("cid123", "My beat");

      await beatWave.listBeatForSale(1, 1000);

      // const balanceAcc2 = await beatWave.balanceOf(acc2.address);
      // console.log(balanceAcc2);

      await beatWave
        .connect(acc2)
        .buyBeat(1000, 1);

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
        .uploadBeat("cid123", "My beat");

      await beatWave.listBeatForSale(1, 1000);

      expect(
        beatWave.connect(acc2).buyBeat(900, 1)
      ).to.be.revertedWith("Incorrect Price");
    });

    it("Should emit event for buy beat", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave
        .connect(acc1)
        .uploadBeat("cid123", "My beat");

      await beatWave.listBeatForSale(1, 1000);

      expect(
        beatWave.connect(acc2).buyBeat(1000, 1)
      )
        .to.emit(beatWave, "BeatSold")
        .withArgs(1, acc1.address, acc2.address, 1000);
    });
  });

  describe("Test function like and transfer owner beat", () => {
    it("Should like a beat", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );

      await beatWave.uploadBeat("cid123", "My beat");
      await beatWave.listBeatForSale(1, 1000);
      await beatWave.likeBeat(1, false);
      await beatWave.connect(acc2).likeBeat(1, false);

      const beat = await beatWave.beats(1);

      expect(beat.numberOfLikes).to.equal(2);
    });

    it("should transfer owner if is owner", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat");

      await beatWave.transferOwner(1, acc2);
      const beat = await beatWave.beats(1);

      expect(beat.owner).to.equal(acc2.address);
    });

    it("should transfer owner if is not owner", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat");

      expect(beatWave.connect(acc2).transferOwner(1, acc2)).to.be.revertedWith(
        "You are not the owner of this beat"
      );
    });

    it("should emit event transfer", async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      await beatWave.uploadBeat("cid123", "My beat");

      await expect(beatWave.transferOwner(1, acc2))
        .to.emit(beatWave, "TransferBeat")
        .withArgs(1, acc1.address, acc2.address);
    });

    it('should change title beat', async () => {
      const { beatWave, acc1, acc2 } = await loadFixture(
        deployBeatWaveContract
      );
      
      await beatWave.uploadBeat("cid123", "My beat");
      const tx = await beatWave.changeTitle(1, 'New title');
      
      const beat = await beatWave.beats(1);
      
      expect(beat.title).to.equal('New title');
    });
  });
  describe("Test function to delete beat with number id", () => {
    it('should owner beats must delete beats', async() => {
      const { beatWave, acc1} = await loadFixture(deployBeatWaveContract);

      //upload beat
      await beatWave.uploadBeat("cid123", "mybeat123");
      
      //delete beat of owner
      const tx = await beatWave.connect(acc1).deleteBeat(1);

      const beat = await beatWave.beats(1);
      const cid = beat.cid;
      const title = beat.title;
      const isForSale = beat.isForSale;
      const owner =  beat.owner;

      expect(cid, title).to.equals("", "");
      expect(isForSale, owner).to.equal(false, addressNull);
      // console.log(beat.owner);
    })

    it("Should burn beat for admin", async() => {
      const { beatWave, acc1, acc2} = await loadFixture(deployBeatWaveContract);
      //upload
      await beatWave.initialize(acc1.address);
      await beatWave.connect(acc2).uploadBeat("cid123", "title1");
      
      // const admin = await beatWave.admin();
      // console.log(admin);
      
      //acc1 is admin can burn beat
      await beatWave.burnBeats(1);

      const beat = await beatWave.beats(1);

      const {owner, cid, title, price, isForSale} = beat;
      expect(owner, cid, title, isForSale).be.equals(addressNull, "", "", false); 
      // expect(title, isForSale).be.equal("", false);
    }); 
  })
});

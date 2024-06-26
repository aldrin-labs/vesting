import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { createMint, createAccount } from "@solana/spl-token";
import { errLogs, provider, payer, getErr } from "../helpers";
import { Vesting } from "../vesting";

export function test() {
  describe("change_vesting_wallet", () => {
    const adminKeypair = Keypair.generate();
    let vesteeWallet: PublicKey;
    let vesteeWalletNew: PublicKey;
    let vestingMint: PublicKey;
    let vesting: Vesting;

    beforeEach("create vesting mint", async () => {
      vestingMint = await createMint(
        provider.connection,
        payer,
        payer.publicKey,
        null,
        9
      );
    });

    beforeEach("create vestee wallet", async () => {
      vesteeWallet = await createAccount(
        provider.connection,
        payer,
        vestingMint,
        payer.publicKey
      );
    });

    beforeEach("create vesting account", async () => {
      vesting = await Vesting.init({
        adminKeypair,
        vesteeWallet,
        mint: vestingMint,
      });
    });
    beforeEach("create new vesting wallet", async () => {
      vesteeWalletNew = await createAccount(
        provider.connection,
        payer,
        vestingMint,
        payer.publicKey,
        Keypair.generate()
      );
    });

    it("fails if wallet account is the same", async () => {
      const logs = await errLogs(
        vesting.changeVesteeWallet({
          adminKeypair,
          vesteeWalletNew: vesteeWallet,
        })
      );

      expect(logs).to.contain(
        "The new vestee wallet is the same as the current vestee wallet"
      );
    });

    it("fails if wallet mint isn't equal to vesting mint", async () => {
      const fakeMint = await createMint(
        provider.connection,
        payer,
        payer.publicKey,
        null,
        9
      );
      vesteeWalletNew = await createAccount(
        provider.connection,
        payer,
        fakeMint,
        payer.publicKey,
        Keypair.generate()
      );

      const logs = await errLogs(
        vesting.changeVesteeWallet({
          adminKeypair,
          vesteeWalletNew,
        })
      );

      expect(logs).to.contain(
        "The new vestee wallet mint must be of correct mint"
      );
    });

    it("fails if admin isn't signer", async () => {
      const logs = await getErr(
        vesting.changeVesteeWallet({
          vesteeWalletNew,
          skipAdminSignature: true,
        })
      );

      expect(logs).to.contain("Signature verification failed");
    });

    it("fails if wrong admin", async () => {
      const fakeAdmin = Keypair.generate();

      const logs = await getErr(
        vesting.changeVesteeWallet({
          vesteeWalletNew,
          adminKeypair: fakeAdmin,
        })
      );

      expect(logs).to.contain(
        "Vesting admin does not match the provided signer"
      );
    });

    it("works", async () => {
      const vestingInfoBefore = await vesting.fetch();

      await vesting.changeVesteeWallet({
        adminKeypair,
        vesteeWalletNew,
      });

      const vestingInfoAfter = await vesting.fetch();

      // Expect wallet pubkey to change
      expect(vestingInfoBefore.vesteeWallet).to.deep.eq(vesteeWallet);
      expect(vestingInfoAfter.vesteeWallet).to.deep.eq(vesteeWalletNew);

      // Check that the remaining values don't change from default values
      expect(vestingInfoAfter.totalVesting.amount.toNumber()).to.eq(10_000);
      expect(vestingInfoAfter.startTs.time.toNumber()).to.eq(1577836801);
      expect(vestingInfoAfter.cliffPeriods.toNumber()).to.eq(12);
      expect(vestingInfoAfter.totalPeriods.toNumber()).to.eq(48);
      expect(vestingInfoAfter.periodType).to.deep.eq({ monthly: {} });

      expect(vestingInfoAfter.admin).to.deep.eq(adminKeypair.publicKey);
      expect(vestingInfoAfter.mint).to.deep.eq(vestingMint);
      expect(vestingInfoAfter.vault).to.deep.eq(await vesting.vestingVault());
      expect(vestingInfoAfter.cumulativeVested.amount.toNumber()).to.eq(0);
      expect(vestingInfoAfter.cumulativeWithdrawn.amount.toNumber()).to.eq(0);
      expect(vestingInfoAfter.vaultBalance.amount.toNumber()).to.eq(0);
      expect(vestingInfoAfter.unfundedLiability.amount.toNumber()).to.eq(0);
    });
  });
}

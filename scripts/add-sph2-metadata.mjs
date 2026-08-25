import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMetadataAccountV3, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import os from "os";

const keypairData = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`));
const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());
const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
umi.use(signerIdentity(signer));

const mint = publicKey("92Lnj4CA1dfZCrvnQQS3JK7fvYPjp2ASr37LTQn8a5MV");

console.log("Adding metadata to Sopho 2 (SPH2)...");

await createMetadataAccountV3(umi, {
  mint,
  mintAuthority: signer,
  data: {
    name: "Sopho 2",
    symbol: "SPH2",
    uri: "",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  },
  isMutable: true,
  collectionDetails: null,
}).sendAndConfirm(umi);

console.log("Done! Sopho 2 (SPH2) metadata added on devnet.");
console.log("Mint: 92Lnj4CA1dfZCrvnQQS3JK7fvYPjp2ASr37LTQn8a5MV");

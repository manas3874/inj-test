import Image from "next/image";
import { Inter } from "next/font/google";
import { useState } from "react";
import {
  MsgSend,
  BaseAccount,
  DEFAULT_STD_FEE,
  ChainRestAuthApi,
  createTransaction,
  CosmosTxV1Beta1Tx,
  ChainRestTendermintApi,
  getTxRawFromTxRawOrDirectSignResponse,
  TxRestClient,
} from "@injectivelabs/sdk-ts";
import {
  // DEFAULT_STD_FEE,
  BigNumberInBase,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
} from "@injectivelabs/utils";
import { ChainId } from "@injectivelabs/ts-types";
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
const inter = Inter({ subsets: ["latin"] });
let testWalletAddr = "inj17xxadj7e9ermxnq7jl5t2zxu5pknhahac8ma8e";

export default function Home() {
  const [publicAddress, setPublicAddress] = useState("");
  async function getKeplr() {
    if (!window.keplr) {
      alert("Please install Keplr extension");
      return;
    }
    await window.keplr.enable("injective-888"); // Example: Enable the Cosmos Hub chain
    const keplr = window.keplr;
    return keplr;
  }
  async function connectWallet() {
    const keplr = await getKeplr();
    if (!keplr) return;

    const chainId = "injective-888";

    const offlineSigner = keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    setPublicAddress(accounts[0].address);
    console.log({ keplr, accounts });
    return { keplr, accounts };
  }
  async function createAndSignTransaction(
    injectiveAddress: string,
    chainId: string,
    restEndpoint: string,
    amount: { denom: string; amount: string; } | { denom: string; amount: string; }[]
  ) {
    const getKeplr = async (chainId: string) => {
      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      const key = await window.keplr.getKey(chainId);
      return { offlineSigner, accounts, key };
    };

    const broadcastTx = async (chainId, txRaw) => {
      const keplr = await getKeplr(chainId);
      const result = await keplr.sendTx(
        chainId,
        CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
        BroadcastMode.Sync
      );

      if (!result || result.length === 0) {
        throw new TransactionException(
          new Error("Transaction failed to be broadcasted"),
          { contextModule: "Keplr" }
        );
      }

      return Buffer.from(result).toString("hex");
    };

    // Account Details
    const chainRestAuthApi = new ChainRestAuthApi(restEndpoint);
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
      injectiveAddress
    );
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
    const accountDetails = baseAccount.toAccountDetails();

    // Block Details
    const chainRestTendermintApi = new ChainRestTendermintApi(restEndpoint);
    const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
    const latestHeight = latestBlock.header.height;
    const timeoutHeight = new BigNumberInBase(latestHeight).plus(
      DEFAULT_BLOCK_TIMEOUT_HEIGHT
    );

    // Preparing the transaction
    const msg = MsgSend.fromJSON({
      amount,
      srcInjectiveAddress: publicAddress,
      dstInjectiveAddress: injectiveAddress,
    });

    // Get the PubKey of the Signer from the Wallet/Private Key
    const { offlineSigner } = await getKeplr(chainId);
    const pubKey = await window.keplr.getKey(chainId); // Assuming getPubKey() is defined elsewhere
    console.log("pubKey", pubKey);
    // Prepare the Transaction
    const { txRaw: txRawToSign, signDoc } = createTransaction({
      pubKey,
      chainId,
      fee: DEFAULT_STD_FEE,
      message: [msg], // Assuming msg is the message to be sent
      sequence: baseAccount.sequence,
      timeoutHeight: timeoutHeight.toNumber(),
      accountNumber: baseAccount.accountNumber,
    });

    const directSignResponse = await offlineSigner.signDirect(
      injectiveAddress,
      signDoc
    );
    const txRaw = getTxRawFromTxRawOrDirectSignResponse(directSignResponse); // Assuming this function is defined elsewhere

    const txHash = await broadcastTx(chainId, txRaw);
    const response = await new TxRestClient(restEndpoint).fetchTxPoll(txHash);

    return response;
  }
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <button onClick={connectWallet}>Connect wallet</button>
      <span>{publicAddress}</span>
      <button
        onClick={() => {
          createAndSignTransaction(
            testWalletAddr,
            "injective-888",
            getNetworkEndpoints(Network.Testnet).rest,
            { amount: "1", denom: "inj" }
          )
            .then((response) => console.log("Transaction Response:", response))
            .catch((error) => console.error("Error:", error));
        }}
      >
        Transact
      </button>
    </main>
  );
}

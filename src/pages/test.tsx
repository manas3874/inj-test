// Filename: InjectiveTxPage.tsx
import React, { useState } from "react";
import {
  MsgSend,
  BaseAccount,
  ChainRestAuthApi,
  createTransaction,
  CosmosTxV1Beta1Tx,
  ChainRestTendermintApi,
  getTxRawFromTxRawOrDirectSignResponse,
  TxRestClient,
  BroadcastMode,
  createCosmosSignDocFromSignDoc,
  SIGN_DIRECT,
} from "@injectivelabs/sdk-ts";
import {
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
  BigNumberInBase,
} from "@injectivelabs/utils";
import { ChainId } from "@injectivelabs/ts-types";
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { walletStrategy } from "./test-2";

const InjectiveTxPage = () => {
  const [txHash, setTxHash] = useState("");

  const executeTransaction = async () => {
    // Define your functions and variables here
    const getKeplr = async (chainId) => {
      await window.keplr.enable(chainId);

      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      const key = await window.keplr.getKey(chainId);

      return { offlineSigner, accounts, key };
    };

    const broadcastTx = async (chainId, txRaw) => {
      const result = await window.keplr.sendTx(
        chainId,
        CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
        "sync"
      );

      if (!result || result.length === 0) {
        throw new TransactionException(
          new Error("Transaction failed to be broadcasted"),
          { contextModule: "Keplr" }
        );
      }

      return Buffer.from(result).toString("hex");
    };
    const chainId = ChainId.Testnet;
    const { key, offlineSigner } = await getKeplr(chainId);
    const pubKey = Buffer.from(key.pubKey).toString("base64");
    const injectiveAddress = key.bech32Address;
    const restEndpoint = getNetworkEndpoints(
      Network.Testnet
    ).rest; /* getNetworkEndpoints(Network.Mainnet).rest */
    const amount = {
      amount: new BigNumberInBase(0.01).toWei().toFixed(),
      denom: "inj",
    };

    /** Account Details **/
    const chainRestAuthApi = new ChainRestAuthApi(restEndpoint);
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
      injectiveAddress
    );
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
    const accountDetails = baseAccount.toAccountDetails();

    /** Block Details */
    const chainRestTendermintApi = new ChainRestTendermintApi(restEndpoint);
    const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
    const latestHeight = latestBlock.header.height;
    const timeoutHeight = new BigNumberInBase(latestHeight).plus(
      DEFAULT_BLOCK_TIMEOUT_HEIGHT
    );

    /** Preparing the transaction */
    const msg = MsgSend.fromJSON({
      amount,
      srcInjectiveAddress: injectiveAddress,
      dstInjectiveAddress: "inj17xxadj7e9ermxnq7jl5t2zxu5pknhahac8ma8e",
    });

    try {
      const { signDoc } = createTransaction({
        pubKey,
        chainId,
        fee: DEFAULT_STD_FEE,
        signMode: SIGN_DIRECT,
        message: [msg],
        sequence: baseAccount.sequence,
        timeoutHeight: timeoutHeight.toNumber(),
        accountNumber: baseAccount.accountNumber,
      });

      const directSignResponse = await offlineSigner.signDirect(
        injectiveAddress,
        createCosmosSignDocFromSignDoc(signDoc)
      );
      const txRaw = getTxRawFromTxRawOrDirectSignResponse(directSignResponse);
      const response = await walletStrategy.signCosmosTransaction({
        txRaw,
        accountNumber: baseAccount.accountNumber,
        chainId: "injective-888",
        address: injectiveAddress,
      });
      console.log("response", response);
      // const txHash = await broadcastTx(ChainId.Testnet, txRaw);
      // console.log({txHash})
      // const response = await new TxRestClient(restEndpoint).fetchTxPoll(
      //   txHash
      // );
      // console.log({response})
      // setTxHash(txHash);
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  };

  return (
    <div>
      <h1>Injective Transaction</h1>
      <button onClick={executeTransaction}>Transact</button>
      {txHash && <p>Transaction Hash: {txHash}</p>}
    </div>
  );
};

export default InjectiveTxPage;
``;

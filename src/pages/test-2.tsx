import {
  MsgBroadcaster,
  Wallet,
  WalletStrategy,
} from "@injectivelabs/wallet-ts";
import { MsgSend } from "@injectivelabs/sdk-ts";
import { BigNumberInBase } from "@injectivelabs/utils";
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainId } from "@injectivelabs/ts-types";

import React from "react";
export const walletStrategy = new WalletStrategy({
  chainId: ChainId.Testnet,
  wallet: Wallet.Keplr,
});
export const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy /* instantiated wallet strategy */,
  network: Network.Testnet,
});
function Test() {
  console.log("walletStrategy", walletStrategy);
  async function run() {
    const signer = "inj1udj57jjtd4vmp9l99v29wu75xshumvqz5vsk0c";

    const msg = MsgSend.fromJSON({
      amount: {
        denom: "inj",
        amount: new BigNumberInBase(0.01).toWei().toFixed(),
      },
      srcInjectiveAddress: signer,
      dstInjectiveAddress: "inj17xxadj7e9ermxnq7jl5t2zxu5pknhahac8ma8e",
    });

    // Prepare + Sign + Broadcast the transaction using the Wallet Strategy
    await msgBroadcastClient.broadcast({
      injectiveAddress: signer,
      msgs: [msg],
    });
  }
  return (
    <div>
      Test{" "}
      <button onClick={run} className="bg-gray-200 text-black">
        Run tx
      </button>
    </div>
  );
}

export default Test;

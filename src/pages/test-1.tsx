import React, { useEffect } from 'react';
import {
  PrivateKey,
  InjectiveStargate,
} from "@injectivelabs/sdk-ts";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { assertIsBroadcastTxSuccess } from '@cosmjs/stargate';
import { Network, getNetworkEndpoints } from "@injectivelabs/networks";

const TestPage = () => {
  useEffect(() => {
    const sendTokens = async () => {
      const chainId = 'injective-888'; // replace with your chain ID
      const recipient = 'inj17xxadj7e9ermxnq7jl5t2zxu5pknhahac8ma8e'; // replace with the recipient address
      const amountToSend = '1'; // replace with the amount to send
  const restEndpoint = "https://testnet.sentry.tm.injective.network:443"
      // Enable Keplr
      await window.keplr.enable(chainId);

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const [account] = await offlineSigner.getAccounts();

      // Initialize the stargate client
      const client =
        await InjectiveStargate.InjectiveSigningStargateClient.connectWithSigner(
          restEndpoint,
          offlineSigner,
        );

      const amount = {
        denom: "uinj",
        amount: amountToSend.toString(),
      };
      const fee = {
        amount: [
          {
            denom: "uinj",
            amount: "5000000000000000",
          },
        ],
        gas: "200000",
      };

      try {
        const result = await client.sendTokens(
          account.address,
          recipient,
          [amount],
          fee,
          ""
        );

        assertIsBroadcastTxSuccess(result);

        if (result.code !== undefined && result.code !== 0) {
          alert("Failed to send tx: " + (result.log || result.rawLog));
        } else {
          alert("Succeed to send tx:" + result.transactionHash);
        }
      } catch (error) {
        console.error("Error sending tokens:", error);
        alert("Error sending tokens: " + error.message);
      }
    };

    sendTokens();
  }, []);

  return (
    <div>
      <h1>Test Page</h1>
      {/* You can add more UI elements here */}
    </div>
  );
};

export default TestPage;

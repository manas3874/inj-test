// Filename: InjectiveTxPage.tsx
import React, { useEffect, useState } from 'react';
import {
  MsgSend,
  BaseAccount,
  ChainRestAuthApi,
  createTransaction,
  CosmosTxV1Beta1Tx,
  ChainRestTendermintApi,
  getTxRawFromTxRawOrDirectSignResponse,
  TxRestClient,BroadcastMode
} from '@injectivelabs/sdk-ts';
import {
  DEFAULT_STD_FEE,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,BigNumberInBase
} from '@injectivelabs/utils';
import { ChainId } from '@injectivelabs/ts-types';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';


const InjectiveTxPage = () => {
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    const executeTransaction = async () => {
      // Define your functions and variables here
     const getKeplr = async (chainId) => {
  await window.keplr.enable(chainId)

  const offlineSigner = window.keplr.getOfflineSigner(chainId)
  const accounts = await offlineSigner.getAccounts()
  const key = await window.keplr.getKey(chainId)

  return { offlineSigner, accounts, key }
}

     const broadcastTx = async (chainId, txRaw) => {
  const keplr = await getKeplr(ChainId.Testnet)
  const result = await window.keplr.sendTx(
    chainId,
    CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
    BroadcastMode.Sync,
  )

  if (!result || result.length === 0) {
    throw new TransactionException(
      new Error('Transaction failed to be broadcasted'),
      { contextModule: 'Keplr' },
    )
  }

  return Buffer.from(result).toString('hex')
}
const getPublicKeyFromKeplr = async (chainId) => {
  const key = await window.keplr.getKey(chainId); 
  
  return Buffer.from(key.pubKey).toString('base64')
}
const injectiveAddress = 'inj1udj57jjtd4vmp9l99v29wu75xshumvqz5vsk0c'
const chainId = 'injective-888' /* ChainId.Mainnet */
const restEndpoint =
  getNetworkEndpoints(Network.Testnet).rest /* getNetworkEndpoints(Network.Mainnet).rest */
const amount = {
  amount: new BigNumberInBase(0.01).toWei().toFixed(),
  denom: 'inj',
}

/** Account Details **/
const chainRestAuthApi = new ChainRestAuthApi(restEndpoint)
const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
  injectiveAddress,
)
const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse)
const accountDetails = baseAccount.toAccountDetails()

/** Block Details */
const chainRestTendermintApi = new ChainRestTendermintApi(restEndpoint)
const latestBlock = await chainRestTendermintApi.fetchLatestBlock()
const latestHeight = latestBlock.header.height
const timeoutHeight = new BigNumberInBase(latestHeight).plus(
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
)

/** Preparing the transaction */
const msg = MsgSend.fromJSON({
  amount,
  srcInjectiveAddress: injectiveAddress,
  dstInjectiveAddress: "inj17xxadj7e9ermxnq7jl5t2zxu5pknhahac8ma8e",
})

/** Get the PubKey of the Signer from the Wallet/Private Key */
const pubKey = await getPublicKeyFromKeplr(ChainId.Testnet)

      try {
    const { txRaw, signDoc } = createTransaction({
  pubKey,
  chainId,
  fee: DEFAULT_STD_FEE,
  message: [msg],
  sequence: baseAccount.sequence,
  timeoutHeight: timeoutHeight.toNumber(),
  accountNumber: baseAccount.accountNumber,
})

// const directSignResponse = await window.keplr.getOfflineSigner(ChainId.Testnet).signDirect(
//   injectiveAddress,
//   signDoc,
// )
// const txRaww = getTxRawFromTxRawOrDirectSignResponse(directSignResponse)
const txHash = await broadcastTx(ChainId.Testnet, txRaw)
const response = await new TxRestClient(restEndpoint).fetchTxPoll(txHash)
        setTxHash(txHash);
      } catch (error) {
        console.error('Error executing transaction:', error);
      }
    };

    if (typeof window !== 'undefined') {
      // Ensures this code is not executed on the server side
      executeTransaction();
    }
  }, []);

  return (
    <div>
      <h1>Injective Transaction</h1>
      {txHash && <p>Transaction Hash: {txHash}</p>}
    </div>
  );
};

export default InjectiveTxPage;

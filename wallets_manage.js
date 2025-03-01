import dotenv from "dotenv";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { CHAINS } from "./absolutevalues.js";
import { ethers } from "ethers";
dotenv.config()


Coinbase.configure({
  apiKeyName: process.env.COINBASE_API_KEY_ID,
  privateKey: process.env.COINBASE_API_KEY_SECRET,
});

export async function generateWallet(chainId) {
  const wallet = await Wallet.create({ networkId: CHAINS[chainId].name});
  const walletData = wallet.export();

  const address = await wallet.getDefaultAddress();
  const privKey = address.export();

  const result = {
    walletId: walletData.walletId,
    seed: walletData.seed,
    address: address.id,
    privateKey: privKey,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function BalanceWallet(walletId) {
  const wallet = await Wallet.fetch(walletId);
  let balance = await wallet.getBalance(Coinbase.assets.Eth);
  console.log(`Wallet ETH balance: ${balance}`);
  return balance;
}

export async function listBalancesWallet(walletId) {
//   try {
    const wallet = await Wallet.fetch(walletId);
    const balances = await wallet.listBalances(); // Fetches all balances
    console.log("Wallet Balances:", balances);
    return balances;
//   } catch (error) {
//     console.error("Error fetching wallet balances:", error);
//   }
}

export async function transferFunds(
  walletId,
  tokenAddress,
  receiverAddress,
  amount,
  seed
) {
  try {
    const wallet = await Wallet.fetch(walletId);
    if (tokenAddress.toUpperCase() === "ETH") {
      tokenAddress = Coinbase.assets.Eth;
    }
    const balance = await wallet.getBalance(tokenAddress);

    if (balance < amount) {
      throw new Error(`Insufficient balance: ${balance}`);
    }

    wallet.setSeed(seed);
    await wallet.export();

    if (!wallet.canSign()) {
      throw new Error("Failed to hydrate wallet");
    }

    const tx = await wallet.createTransfer({
      amount: amount,
      assetId: tokenAddress,
      destination: receiverAddress,
    });

    console.log(`Transaction submitted: ${tx.id}`);

    const receipt = await tx.getTransaction();
    return {
      transferTransactionHash: await receipt.getTransactionHash(),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: receipt.gasPrice.toString(),
    };
  } catch (error) {
    console.error(`Transfer failed: ${error}`);
    throw error;
  }
}
 export async function performDryRun(
  address,
  tokenInAddress,
  tokenOutAddress,
  amount,
  chainId
) {
  let tokenInDecimals;
  if (tokenInAddress == ETH) {
    tokenInAddress = ETH_ADDRESS;
    tokenInDecimals = 18;
  }

  if (tokenOutAddress == ETH) {
    tokenOutAddress = ETH_ADDRESS;
  }

  const provider = new ethers.JsonRpcProvider(CHAINS[chainId].rpcUrl);
  const tokenInContract = new ethers.Contract(
    tokenInAddress,
    ERC20_ABI,
    provider
  );

  if (tokenInAddress != ETH_ADDRESS) {
    tokenInDecimals = Number(await tokenInContract.decimals());
  }

  const inputAmount = Number(
    ethers.parseUnits(amount.toString(), tokenInDecimals)
  );

  const params = new URLSearchParams({
    sellToken: tokenInAddress,
    buyToken: tokenOutAddress,
    sellAmount: inputAmount,
    chainId: chainId,
    taker: address,
  });
  const quoteParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    quoteParams.append(key, value);
  }
  console.log(
    `ZeroEx API response status: ${ZERO_EX_PRICE_URL + quoteParams.toString()}`
  );
  const signal = AbortSignal.timeout(10000);
  const quoteResponse = await fetch(
    ZERO_EX_PRICE_URL + quoteParams.toString(),
    { headers: ZERO_EX_API_HEADER, signal }
  );
  const quote = await quoteResponse.json();

  if (quoteResponse.status !== 200) {
    throw new Error(`0x API error ${JSON.stringify(quote)}`);
  }
  if (!quote.liquidityAvailable) {
    throw new Error(`Not enough liquidity available for this trade.`);
  }

  const gasFees = quote.gas * quote.gasPrice;
  const result = {
    inputAmount: inputAmount,
    quoteAmount: quote.buyAmount,
    gasLimit: quote.gas,
    gasPrice: quote.gasPrice,
    totalGasFees: gasFees,
    zid: quote.zid,
  };
  const serializedResult = JSON.stringify(result, null, 2);
  console.log(serializedResult);
  return serializedResult;
}


generateWallet(8453);
BalanceWallet("970ceb94-964c-4d7a-90ad-427ebc6a3204");
listBalancesWallet("970ceb94-964c-4d7a-90ad-427ebc6a3204");
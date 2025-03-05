import dotenv from "dotenv";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import {
  CHAINS,
  MAX_RETRIES,
  ETH_ADDRESS,
  ZERO_EX_PRICE_URL,
  ZERO_EX_API_HEADER,
  ERC20_ABI,
  ONE_INCH_QUOTE_URL,
  ONE_INCH_HEADER,
  ONE_INCH_BALANCE_URL,
} from "./absolutevalues.js";
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
  console.log(`Generated Wallet info:`);
  console.log(JSON.stringify(result, null, 2));

  return result;
}

export async function BalanceWallet(walletId) {
  const wallet = await Wallet.fetch(walletId);
  let balance = await wallet.getBalance(Coinbase.assets.Eth);
  console.log(`Wallet ETH balance: ${balance}`);
  return balance;
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
    if (balance <= amount) {
      throw new Error(`Insufficient balance: ${balance}`);
    }

    wallet.setSeed(seed);
    await wallet.export();

    if (!wallet.canSign()) {
      throw new Error("Failed to hydrate wallet");
    }

    let retries = 0;
    let txHash;

    while (retries < MAX_RETRIES) {
      try {
        const tx = await wallet.createTransfer({
          amount: amount,
          assetId: tokenAddress,
          destination: receiverAddress,
        });

        console.log(`Transaction submitted: ${tx.id}`);
        await tx.wait({ intervalSeconds: 1, timeoutSeconds: 5 });

        const receipt = await tx.getTransaction();
        txHash = await receipt.getTransactionHash();

        if (!txHash) {
          retries++;
          console.log(`Transaction attempt ${retries} failed. Retrying...`);
          continue;
        }

        // Fetch raw transaction details
        const rawTx = await tx.getRawTransaction();
        const { maxPriorityFeePerGas, maxFeePerGas, value, gasLimit } = rawTx;

        // Convert BigInt values to string
        const result = {
          transferTransactionHash: txHash,
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          maxFeePerGas: maxFeePerGas.toString(),
          value: value.toString(),
          gasLimit: gasLimit.toString(),
        };

        console.log("Final Transaction Details:", result);
        return result;
      } catch (error) {
        retries++;
        console.log(
          `Error on attempt ${retries}: ${error.message}. Retrying...`
        );
      }
    }

    throw new Error("Transaction failed after maximum retries");
  } catch (error) {
    console.error(`Transfer failed: ${error.message}`);
    throw error;
  }
}

// export async function performDryRun(        // zero x 
//   address,
//   tokenInAddress,
//   tokenOutAddress,
//   amount,
//   chainId
// ) {
//   let tokenInDecimals;
//   if (tokenInAddress == "ETH") {
//     tokenInAddress = ETH_ADDRESS;
//     tokenInDecimals = 18;
//   }

//   if (tokenOutAddress == "ETH") {
//     tokenOutAddress = ETH_ADDRESS;
//   }

//   const provider = new ethers.JsonRpcProvider(CHAINS[chainId].rpcUrl);
//   const tokenInContract = new ethers.Contract(
//     tokenInAddress,
//     ERC20_ABI,
//     provider
//   );

//   if (tokenInAddress != ETH_ADDRESS) {
//     tokenInDecimals = Number(await tokenInContract.decimals());
//   }

//   const inputAmount = Number(
//     ethers.parseUnits(amount.toString(), tokenInDecimals)
//   );

//   const params = new URLSearchParams({
//     sellToken: tokenInAddress,
//     buyToken: tokenOutAddress,
//     sellAmount: inputAmount,
//     chainId: chainId,
//     taker: address,
//   });
//   const quoteParams = new URLSearchParams();
//   for (const [key, value] of params.entries()) {
//     quoteParams.append(key, value);
//   }
//   console.log(
//     `ZeroEx API response status: ${ZERO_EX_PRICE_URL + quoteParams.toString()}`
//   );
//   const signal = AbortSignal.timeout(10000);
//   const quoteResponse = await fetch(
//     ZERO_EX_PRICE_URL + quoteParams.toString(),
//     { headers: ZERO_EX_API_HEADER, signal }
//   );
//   const quote = await quoteResponse.json();

//   if (quoteResponse.status !== 200) {
//     throw new Error(`0x API error ${JSON.stringify(quote)}`);
//   }
//   if (!quote.liquidityAvailable) {
//     throw new Error(`Not enough liquidity available for this trade.`);
//   }

//   const gasFees = quote.gas * quote.gasPrice;
//   const result = {
//     inputAmount: inputAmount,
//     quoteAmount: quote.buyAmount,
//     gasLimit: quote.gas,
//     gasPrice: quote.gasPrice,
//     totalGasFees: gasFees,
//     zid: quote.zid,
//   };
//   const serializedResult = JSON.stringify(result, null, 2);
//   console.log(serializedResult);
//   return serializedResult;
// }

export async function performDryRun(
  chainId,
  address,
  tokenInAddress,
  tokenOutAddress,
  amount
) {
  if (!CHAINS[chainId]) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const provider = new ethers.JsonRpcProvider(CHAINS[chainId].rpcUrl);

  // Function to get token decimals
  const getTokenDecimals = async (token) => {
    if (token === "ETH") return 18;
    const contract = new ethers.Contract(token, ERC20_ABI, provider);
    return Number(await contract.decimals());
  };

  const tokenInDecimals = await getTokenDecimals(tokenInAddress);
  const tokenOutDecimals = await getTokenDecimals(tokenOutAddress);

  const inputAmount = ethers.parseUnits(amount, tokenInDecimals);

  const params = new URLSearchParams({
    src: tokenInAddress === "ETH" ? ETH_ADDRESS : tokenInAddress,
    dst: tokenOutAddress === "ETH" ? ETH_ADDRESS : tokenOutAddress,
    amount: inputAmount.toString(),
    takerAddress: address,
  });

  const quoteResponse = await fetch(
    ONE_INCH_QUOTE_URL.replace("{chain}", chainId) + params.toString(),
    { headers: ONE_INCH_HEADER }
  );

  if (!quoteResponse.ok) {
    throw new Error(`Failed to fetch quote: ${quoteResponse.statusText}`);
  }

  const quote = await quoteResponse.json();
  const result = {
    taker: address,
    chain: CHAINS[chainId].name,
    soldToken: {
      address: tokenInAddress,
      amount: amount, 
    },
    buyToken: {
      address: tokenOutAddress,
      amount: ethers.formatUnits(quote.dstAmount, tokenOutDecimals), 
    },
    quoteAmount: ethers.formatUnits(quote.dstAmount, tokenOutDecimals),
  };

  console.log("Dry Run Result:", JSON.stringify(result, null, 2));
  return result;
}



export async function getTokenHoldings(chainId, walletAddress) {
  try {
    if (!CHAINS[chainId]) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(CHAINS[chainId].rpcUrl);

    // Function to fetch token decimals
    const getTokenDecimals = async (tokenAddress) => {
      if (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
        return 18; // ETH
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      return Number(await contract.decimals());
    };

    // Construct the API URL
    const url = `${ONE_INCH_BALANCE_URL}/${chainId}/balances/${walletAddress}`;

    // Fetch balances from 1inch API
    const response = await fetch(url, {
      headers: ONE_INCH_HEADER,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const balances = await response.json();

    if (!balances || Object.keys(balances).length === 0) {
      throw new Error("No balances found or API returned empty data.");
    }

    // Filter out zero balances
    const filteredBalances = Object.entries(balances).filter(
      ([_, balance]) => balance !== "0"
    );

    const tokenHoldings = [];

    for (const [tokenAddress, rawBalance] of filteredBalances) {
      const decimals = await getTokenDecimals(tokenAddress);
      tokenHoldings.push({
        address: tokenAddress,
        amount: ethers.formatUnits(rawBalance, decimals),
        decimals: decimals
      });
    }

    const result = {
      address: walletAddress,
      chain: CHAINS[chainId].name,
      tokens: tokenHoldings,
    };

    console.log("Formatted Token Holdings:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error fetching token holdings:", error);
    throw error;
  }
}


export async function performCrossChainDryRun(
  srcChain,
  dstChain,
  srcTokenAddress,
  dstTokenAddress,
  amount,
  walletAddress
) {
  try {
    if (!CHAINS[srcChain] || !CHAINS[dstChain]) {
      throw new Error(`Unsupported chain(s): ${srcChain}, ${dstChain}`);
    }

    const srcProvider = new ethers.JsonRpcProvider(CHAINS[srcChain].rpcUrl);
    const dstProvider = new ethers.JsonRpcProvider(CHAINS[dstChain].rpcUrl);

    // Function to get token decimals
    const getTokenDecimals = async (provider, token) => {
      if (token === "ETH") return 18;
      const contract = new ethers.Contract(token, ERC20_ABI, provider);
      return Number(await contract.decimals());
    };

    // Fetch decimals from on-chain
    const srcTokenDecimals = await getTokenDecimals(
      srcProvider,
      srcTokenAddress
    );
    const dstTokenDecimals = await getTokenDecimals(
      dstProvider,
      dstTokenAddress
    );

    // Convert input amount to smallest unit
    const inputAmount = ethers.parseUnits(amount, srcTokenDecimals);

    const params = new URLSearchParams({
      srcChain,
      dstChain,
      srcTokenAddress,
      dstTokenAddress,
      amount: inputAmount.toString(),
      walletAddress,
      enableEstimate: "true",
    });

    const quoteResponse = await fetch(
      `https://api.1inch.dev/fusion-plus/quoter/v1.0/quote/receive?${params.toString()}`,
      { headers: ONE_INCH_HEADER }
    );

    if (!quoteResponse.ok) {
      throw new Error(`Failed to fetch quote: ${quoteResponse.statusText}`);
    }

    const quote = await quoteResponse.json();

    // Format output
    const result = {
      srcChain,
      dstChain,
      amountSold: amount, // Human-readable input
      amountBought: ethers.formatUnits(quote.dstTokenAmount, dstTokenDecimals),
      gasCost: quote.presets?.fast?.gasCost?.gasPriceEstimate || "N/A",
      srcToken: {
        address: srcTokenAddress,
        decimals: srcTokenDecimals,
      },
      dstToken: {
        address: dstTokenAddress,
        decimals: dstTokenDecimals,
      },
    };

    console.log("Cross-Chain Dry Run Result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error performing cross-chain dry run:", error);
    throw error;
  }
}


(async () => {
  try {
    const chainId = 8453; // Base Mainnet
    const address = "0xd2d228243D68C26b756503d0e0594Ec6DB0008E1";
    const tokenIn = "0x63706e401c06ac8513145b7687A14804d17f814b"; // Native token
    const tokenOut = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Example USDC address
    const amount = "100"; // Amount in ETH

    const result = await performDryRun(chainId,address, tokenIn, tokenOut, amount);
    console.log(":", result);
  } catch (error) {
    console.error("Error during dry run:", error);
  }
})();


generateWallet(8453);
BalanceWallet("970ceb94-964c-4d7a-90ad-427ebc6a3204");
listBalancesWallet("970ceb94-964c-4d7a-90ad-427ebc6a3204");

(async () => {
  try {
    const chainId = 8453; // Base mainnet
    const walletAddress = "0xb7333d779c6ecdfc4507a53706b0e173bd086a18"; // Example address

    const holdings = await getTokenHoldings(chainId, walletAddress);
    console.log("Final Token Holdings:", holdings);
  } catch (error) {
    console.error("Test Failed:", error);
  }
})();
async function testCrossChainDryRun() {
  const srcChain = 8453; // base Mainnet
  const dstChain = 42161; // arbitrum
  const srcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Usdc on base (6 decimals)
  const dstTokenAddress = "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0"; // arb on arbitrum(18 decimals)
  const amount = "100"; // 100 USDC
  const walletAddress = "0xb7333d779c6ecdfc4507a53706b0e173bd086a18"; // Example wallet

  try {
    console.log("Running cross-chain swap dry run...");
    const result = await performCrossChainDryRun(
      srcChain,
      dstChain,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress
    );

    console.log("Test Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCrossChainDryRun();
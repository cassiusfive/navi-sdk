import { Transaction } from "@mysten/sui/transactions";
import { CoinInfo, PoolConfig, OptionType, PoolRewards } from '../../types';
import { SuiClient } from "@mysten/sui/client";
/**
 * Deposits a specified amount of a coin into a pool.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the coin you own.
 * @param amount - The amount of the coin to deposit.
 * @returns The updated transaction block object.
 */
export declare function depositCoin(txb: Transaction, _pool: PoolConfig, coinObject: any, amount: any): Promise<Transaction>;
/**
 * Deposits a coin with account cap.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the coin you own.
 * @param account - The account to deposit the coin into.
 * @returns The updated transaction block object.
 */
export declare function depositCoinWithAccountCap(txb: Transaction, _pool: PoolConfig, coinObject: any, account: string): Promise<Transaction>;
/**
 * Withdraws a specified amount of coins from a pool.
 *
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param amount - The amount of coins to withdraw.
 * @returns The updated transaction block object.
 */
export declare function withdrawCoin(txb: Transaction, _pool: PoolConfig, amount: number): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Withdraws a specified amount of coins from an account with an account cap.
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object.
 * @param account - The account from which to withdraw the coins.
 * @param withdrawAmount - The amount of coins to withdraw.
 * @param sender - The sender of the transaction.
 */
export declare function withdrawCoinWithAccountCap(txb: Transaction, _pool: PoolConfig, account: string, withdrawAmount: number, sender: string): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Borrows a specified amount of coins from a pool.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param borrowAmount - The amount of coins to borrow.
 * @returns The updated transaction block object.
 */
export declare function borrowCoin(txb: Transaction, _pool: PoolConfig, borrowAmount: number): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Repays a debt in the protocol.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the Coin you own.
 * @param repayAmount - The amount you want to repay.
 * @returns The updated transaction block object.
 */
export declare function repayDebt(txb: Transaction, _pool: PoolConfig, coinObject: any, repayAmount: any): Promise<Transaction>;
/**
 * Retrieves the health factor for a given address.
 * @param txb - The Transaction object.
 * @param address - The address for which to retrieve the health factor.
 * @returns The health factor balance.
 */
export declare function getHealthFactorPTB(txb: Transaction, address: string): Promise<import("@mysten/sui/transactions").TransactionResult>;
/**
 * Merges multiple coins into a single coin object.
 *
 * @param txb - The transaction block object.
 * @param coinInfo - The coin information object.
 * @returns The merged coin object.
 */
export declare function returnMergedCoins(txb: Transaction, coinInfo: any): {
    $kind: "Input";
    Input: number;
    type?: "object";
};
/**
 * Executes a flash loan transaction.
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object representing the pool.
 * @param amount - The amount of the flash loan.
 * @returns An array containing the balance and receipt of the flash loan transaction.
 */
export declare function flashloan(txb: Transaction, _pool: PoolConfig, amount: number): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Repays a flash loan by calling the flash_repay_with_ctx function in the lending protocol.
 *
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object representing the pool.
 * @param receipt - The receipt object.
 * @param repayCoin - The asset ID of the asset to be repaid.
 * @returns The balance after the flash loan is repaid.
 */
export declare function repayFlashLoan(txb: Transaction, _pool: PoolConfig, receipt: any, repayCoin: any): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Liquidates a transaction block.
 * @param txb - The transaction block to be liquidated.
 * @param payCoinType - The type of coin to be paid.
 * @param payCoinObj - The payment coin object.
 * @param collateralCoinType - The type of collateral coin.
 * @param to_liquidate_address - The address to which the liquidated amount will be sent.
 * @param to_liquidate_amount - The amount to be liquidated.
 * @returns An array containing the collateral coin and the remaining debt coin.
 */
export declare function liquidateFunction(txb: Transaction, payCoinType: CoinInfo, payCoinObj: any, collateralCoinType: CoinInfo, to_liquidate_address: string, to_liquidate_amount: string): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]>;
/**
 * Signs and submits a transaction block using the provided client and keypair.
 * @param txb - The transaction block to sign and submit.
 * @param client - The client object used to sign and execute the transaction block.
 * @param keypair - The keypair used as the signer for the transaction block.
 * @returns A promise that resolves to the result of signing and executing the transaction block.
 */
export declare function SignAndSubmitTXB(txb: Transaction, client: any, keypair: any): Promise<any>;
/**
 * Stakes a given SUI coin object to the vSUI pool.
 * @param txb The transaction block object.
 * @param suiCoinObj The SUI coin object to be staked.
 * @returns vSui coin object.
 */
export declare function stakeTovSuiPTB(txb: Transaction, suiCoinObj: any): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}>;
/**
 * Unstakes TOV SUI coins.
 * @param txb - The transaction block object.
 * @param vSuiCoinObj - The vSui coin object.
 * @returns The unstaked Sui coin.
 */
export declare function unstakeTovSui(txb: Transaction, vSuiCoinObj: any): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}>;
/**
 * Retrieves available rewards for the given address.
 *
 * @param client - Sui client instance.
 * @param checkAddress - The address for which rewards are being checked.
 * @param contractOptionTypes - Array of contract option types to filter rewards (e.g., [1], [3], or [1,3]).
 *                              When passing [1], only supply rewards will be returned.
 *                              When passing [3], only borrow rewards will be returned.
 *                              When passing [1,3], rewards for both options will be returned.
 * @param prettyPrint - Flag to determine if the result should be pretty printed.
 * @param includeV2 - Feature flag to enable/disable V2 logic.
 * @returns Promise resolving to an array of aggregated PoolRewards.
 */
export declare function getAvailableRewards(client: SuiClient, checkAddress: string, contractOptionTypes: OptionType[], // Use ContractOptionType[] if you have a dedicated type
prettyPrint?: boolean, includeV2?: boolean): Promise<PoolRewards[]>;
/**
   * Claims all available rewards for the specified account.
   * @returns PTB result
   */
export declare function claimAllRewardsPTB(client: SuiClient, userToCheck: string, existingTx?: Transaction): Promise<Transaction>;
/**
   * Claims available rewards by asset ID for the specified account.
   * @returns PTB result
   */
export declare function claimRewardsByAssetIdPTB(client: SuiClient, userToCheck: string, assetId: number, existingTx?: Transaction): Promise<Transaction>;
/**
   * Claims all available rewards for the specified account.
   * @returns PTB result
   */
export declare function claimAllRewardsResupplyPTB(client: SuiClient, userToCheck: string, existingTx?: Transaction): Promise<Transaction>;
/**
 * Updates the price of the given transaction using the provided client.
 *
 * @param client - The SuiClient used to update the price.
 * @param txb - The Transaction to update the price for.
 * @returns A Promise that resolves once the price has been updated.
 */
export declare function updateOraclePTB(client: SuiClient, txb: Transaction): Promise<void>;
/**
 * Registers the required struct types for the PTB common functions.
 */
export declare function registerStructs(): void;

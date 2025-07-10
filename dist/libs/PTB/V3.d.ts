import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { V3Type } from "../../types";
export declare function registerStructs(): void;
/**
 * Fetch and group available v3 rewards for a user.
 *
 * @param {SuiClient} client - The Sui client instance used to interact with the blockchain.
 * @param {string} userAddress - The blockchain address of the user whose rewards are being fetched.
 * @param {boolean} [prettyPrint=true] - Whether to log the rewards data in a readable format.
 * @returns {Promise<V3Type.GroupedRewards | null>} A promise resolving to the grouped rewards by asset type, or null if no rewards.
 * @throws {Error} If fetching rewards data fails or returns undefined.
 */
export declare function getAvailableRewards(client: SuiClient, checkAddress: string, prettyPrint?: boolean): Promise<V3Type.GroupedRewards | null>;
/**
 * Retrieves the available rewards for a specific user in the protocol.
 *
 * This function communicates with the Sui blockchain to fetch and process
 * claimable rewards for a user based on their interactions with the protocol.
 *
 * @param {SuiClient} client - The Sui client instance used to interact with the blockchain.
 * @param {string} userAddress - The blockchain address of the user whose rewards are being fetched.
 * @param {boolean} [prettyPrint=true] - Whether to log the rewards data in a readable format.
 * @returns {Promise<V3Type.GroupedRewards | null>} A promise resolving to the grouped rewards by asset type, or null if no rewards.
 * @throws {Error} If fetching rewards data fails or returns undefined.
 */
export declare function getAvailableRewardsWithoutOption(client: SuiClient, userAddress: string, prettyPrint?: boolean): Promise<V3Type.GroupedRewards | null>;
/**
 * Claim a specific reward by calling the Move entry function.
 * @param tx The Transaction object.
 * @param rewardInfo The minimal reward info, including asset_coin_type, reward_coin_type, rule_ids
 */
export declare function claimRewardFunction(tx: Transaction, rewardInfo: V3Type.ClaimRewardInput): Promise<void>;
/**
 * Claim all rewards for a user by iterating through the grouped rewards.
 * @param client SuiClient instance
 * @param userAddress The address of the user to claim for
 * @param existingTx (Optional) If provided, we append to this Transaction instead of creating a new one
 * @returns The Transaction with all claim commands appended
 */
export declare function claimAllRewardsPTB(client: SuiClient, userAddress: string, existingTx?: Transaction): Promise<Transaction>;
export declare function claimRewardsByAssetIdPTB(client: SuiClient, userAddress: string, assetId: number, existingTx?: Transaction): Promise<Transaction>;
/**
 * Claim a specific reward by calling the Move entry function.
 * @param tx The Transaction object.
 * @param rewardInfo The minimal reward info, including asset_coin_type, reward_coin_type, rule_ids
 */
export declare function claimRewardResupplyFunction(tx: Transaction, rewardInfo: V3Type.ClaimRewardInput, userAddress: string): Promise<void>;
/**
 * Claim all rewards for a user by iterating through the grouped rewards.
 * @param client SuiClient instance
 * @param userAddress The address of the user to claim for
 * @param existingTx (Optional) If provided, we append to this Transaction instead of creating a new one
 * @returns The Transaction with all claim commands appended
 */
export declare function claimAllRewardsResupplyPTB(client: SuiClient, userAddress: string, existingTx?: Transaction): Promise<Transaction>;
export declare function getBorrowFee(client: SuiClient): Promise<number>;
/**
 * Calculate APY information (supply and borrow) for a list of grouped asset pools.
 *
 * @param groupedPools - Grouped pool data after calling `groupByAssetCoinType`.
 * @param poolsInfo - Full pool information (usually fetched from backend or a mock).
 * @returns An array of APY result objects for each pool.
 */
export declare function calculateApy(groupedPools: V3Type.GroupedAssetPool[], reserves: V3Type.ReserveData[], coinPriceMap: Record<string, {
    value: number;
    decimals: string;
}>): Promise<V3Type.ApyResult[]>;
/**
 * Group the raw incentive data by asset_coin_type.
 *
 * @param incentiveData - Data structure returned by the Sui client.
 * @returns A list of grouped asset pools, each containing an array of rules.
 */
export declare function groupByAssetCoinType(incentiveData: V3Type.IncentiveData): V3Type.GroupedAssetPool[];
export declare function getCurrentRules(client: SuiClient): Promise<V3Type.GroupedAssetPool[]>;
/**
 * Main function to fetch on-chain data and compute APY information for third party.
 *
 * @param client - SuiClient instance used to fetch the raw data.
 * @returns An array of final APY results for each pool.
 */
export declare function getPoolsApyOuter(client: SuiClient, Token?: string): Promise<V3Type.ApyResult[]>;
export declare function getPoolApy(client: SuiClient): Promise<V3Type.ApyResult[]>;
export declare function getPoolsApy(client: SuiClient, Token?: string): Promise<V3Type.ApyResult[]>;

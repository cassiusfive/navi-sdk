import { Transaction } from "@mysten/sui/transactions";
import { OptionType } from "../../types";
import { SuiClient } from "@mysten/sui/client";
/**
 * Retrieves the incentive pools for a given asset and option.
 * @param assetId - The ID of the asset.
 * @param option - The option type.
 * @param user - (Optional) The user's address. If provided, the rewards claimed by the user and the total rewards will be returned.
 * @returns The incentive pools information.
 */
export declare function getIncentivePools(client: SuiClient, assetId: number, option: OptionType, user: string): Promise<any>;
interface FormattedData {
    [key: string]: {
        asset_id: number;
        funds: string;
        available: string;
        reward_id: string;
        reward_coin_type: string;
        asset_symbol?: string;
    };
}
/**
 * Retrieves the available rewards for a given address.
 *
 * @param checkAddress - The address to check for rewards. Defaults to the current address.
 * @param option - The option type. Defaults to 1.
 * @param prettyPrint - Whether to print the rewards in a pretty format. Defaults to true.
 * @returns An object containing the summed rewards for each asset.
 * @throws If there is an error retrieving the available rewards.
 */
export declare function getAvailableRewards(client: SuiClient, checkAddress: string, option?: OptionType, prettyPrint?: boolean): Promise<FormattedData>;
/**
 * Claims all available rewards for the specified account.
 * @returns PTB result
 */
export declare function claimAllRewardsPTB(client: SuiClient, userToCheck: string, tx?: Transaction): Promise<Transaction>;
export declare function claimRewardsByAssetIdPTB(client: SuiClient, userToCheck: string, assetId: number, tx?: Transaction): Promise<Transaction>;
/**
 * Claims the reward for a transaction block.
 * @param txb - The transaction block.
 * @param incentiveFundsPool - The incentive funds pool.
 * @param assetId - The asset ID.
 * @param option - The option type.
 */
export declare function claimRewardFunction(txb: Transaction, incentiveFundsPool: string, assetId: number, option: OptionType): Promise<void>;
/**
 * Claims all available rewards for the specified account.
 * @returns PTB result
 */
export declare function claimAllRewardsResupplyPTB(client: SuiClient, userToCheck: string, tx?: Transaction): Promise<Transaction>;
/**
 * Claims the reward for a transaction block.
 * @param txb - The transaction block.
 * @param incentiveFundsPool - The incentive funds pool.
 * @param assetId - The asset ID.
 * @param option - The option type.
 */
export declare function claimRewardResupplyFunction(txb: Transaction, incentiveFundsPool: string, assetId: number, option: OptionType): Promise<void>;
export declare function getIncentivePoolsByPhase(client: SuiClient, option: OptionType, user: string): Promise<any>;
export {};

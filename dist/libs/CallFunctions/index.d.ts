import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Pool, OptionType } from '../../types';
/**
 * Moves and inspects a function call.
 * @param client - The SuiClient object.
 * @param sender - The sender of the function call.
 * @param target - The target of the function call in the format `${string}::${string}::${string}`.
 * @param args - The arguments for the function call.
 * @param typeArgs - Optional type arguments for the function call.
 * @param typeName - Optional type name for the function call.
 * @returns A Promise that resolves to the result of the move and inspect operation.
 */
export declare function moveInspect(tx: Transaction, client: SuiClient, sender: string, target: `${string}::${string}::${string}`, args: any[], typeArgs?: string[], typeName?: string): Promise<any[]>;
/**
 * Retrieves the detailed information of a reserve based on the provided asset ID.
 * @param assetId - The ID of the asset for which to retrieve the reserve details.
 * @returns A Promise that resolves to the parsed result of the reserve details.
 */
export declare function getReservesDetail(assetId: number, client: SuiClient): Promise<import("@mysten/sui/client").SuiObjectResponse>;
export declare function getAddressPortfolio(address: string, prettyPrint: boolean | undefined, client: SuiClient, decimals?: boolean, tokenFilter?: (keyof Pool)[]): Promise<Map<string, {
    borrowBalance: number;
    supplyBalance: number;
}>>;
export declare function getHealthFactorCall(address: string, client: SuiClient): Promise<any>;
export declare function getReserveData(address: string, client: SuiClient): Promise<any>;
export declare function getIncentiveAPY(address: string, client: SuiClient, option: OptionType): Promise<any>;
export declare function getCoinOracleInfo(client: SuiClient, oracleIds: number[]): Promise<any>;
export declare function getUserState(client: SuiClient, address: string): Promise<any>;

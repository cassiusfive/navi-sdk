import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { Quote } from "../../types";
/**
 * Build a swap transaction without service fee
 * @param userAddress - The address of the user
 * @param txb - The transaction builder
 * @param coinIn - The input coin
 * @param quote
 * @param minAmountOut - The minimum amount out
 * @param referral - The referral
 * @param ifPrint - If print
 * @returns
 */
export declare function buildSwapWithoutServiceFee(userAddress: string, txb: Transaction, coinIn: TransactionResult, quote: Quote, minAmountOut: number, referral?: number, ifPrint?: boolean): Promise<TransactionResult>;

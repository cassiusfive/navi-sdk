import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { Quote, SwapOptions } from "../../types";
export interface ServiceFeeResult {
    router: Quote;
    serviceFeeRouter: Quote | null;
    serviceFeeCoinIn: TransactionResult;
}
/**
 * Handle service fee
 * @param userAddress - The address of the user
 * @param txb - The transaction builder
 * @param coinIn - The input coin
 * @param quote - The quote
 * @param serviceFee - The service fee
 * @param apiKey - The API key
 * @param swapOptions - The swap options
 * @returns The service fee result
 */
export declare function handleServiceFee(userAddress: string, txb: Transaction, coinIn: TransactionResult, quote: Quote, serviceFee: any, apiKey?: string, swapOptions?: SwapOptions): Promise<ServiceFeeResult>;
/**
 * Emit a service fee event
 * @param txb - The transaction builder
 * @param coinOut - The output coin
 * @param feeCoinOut - The fee output coin
 * @param serviceFee - The service fee
 * @param router - The router
 * @param referral - The referral
 */
export declare function emitServiceFeeEvent(txb: Transaction, coinOut: TransactionResult, feeCoinOut: TransactionResult, serviceFee: any, router: Quote, referral: number): void;

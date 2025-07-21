import { Transaction } from "@mysten/sui/transactions";
import { CoinInfo } from "../../types";
type repayWithCollateralOptions = {
    useFlashloan?: boolean;
    apiKey?: string;
    baseUrl?: string;
    slippage?: number;
};
/**
 * Repays borrow positions with collateral using flashloans.
 *
 * @param txb - The transaction builder.
 * @param amount - The amount to repay in smallest unit
 * @param debtCoin - The coin of the debt to repay.
 * @param collateralCoin - The coin of the supply position to repay the debt with.
 * @param address - The user's address.
 * @returns The updated transaction builder.
 */
export declare function repayWithCollateral(txb: Transaction, amount: number, debtCoin: CoinInfo, collateralCoin: CoinInfo, address: string, options?: repayWithCollateralOptions): Promise<Transaction>;
export {};

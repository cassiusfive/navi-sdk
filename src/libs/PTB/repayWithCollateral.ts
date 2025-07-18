import { Transaction } from "@mysten/sui/transactions";
import {
    buildSwapPTBFromQuote,
    flashloan,
    getQuote,
    repayDebt,
    repayFlashLoan,
    withdrawCoin,
} from "../../libs/PTB";
import { CoinInfo } from "../../types";
import { getAllPools } from "../PoolInfo";
import { getFlashloanFee } from "./migrate";

type repayWithCollateralOptions = {
    apiKey?: string;
    baseUrl?: string;
    slippage?: number;
};

function getPriceFromPool(pool: any) {
    return Number(pool.oracle.price);
}

function calcAmountNeededToRepay(
    amountToRepay: number,
    debtCoinPrice: number,
    debtCoinDecimals: number,
    collateralCoinPrice: number,
    collateralCoinDecimals: number,
    flashloanFee: number,
    slippage: number,
) {
    const R =
        (collateralCoinPrice * Math.pow(10, debtCoinDecimals)) /
        (debtCoinPrice * Math.pow(10, collateralCoinDecimals));

    const flashloanDebt = amountToRepay * (1 + flashloanFee);

    const collateralAmountNeeded = Math.ceil(flashloanDebt / (R * (1 - slippage)));
    const swapAmountOut = Math.ceil(collateralAmountNeeded * R * (1 - slippage));

    return [collateralAmountNeeded, swapAmountOut];
}

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
export async function repayWithCollateral(
    txb: Transaction,
    amount: number,
    debtCoin: CoinInfo,
    collateralCoin: CoinInfo,
    address: string,
    options?: repayWithCollateralOptions,
) {
    const allPools = await getAllPools();

    const collateralPool = allPools[collateralCoin.symbol];
    const debtPool = allPools[debtCoin.symbol];

    const collateralPoolConfig: any = {
        assetId: collateralPool.id,
        poolId: collateralPool.contract.pool,
        type: collateralPool.coinType,
    };
    const debtPoolConfig: any = {
        assetId: debtPool.id,
        poolId: debtPool.contract.pool,
        type: debtPool.coinType,
    };

    const collateralCoinPrice = getPriceFromPool(collateralPool);
    const debtCoinPrice = getPriceFromPool(debtPool);

    const flashloanFee = await getFlashloanFee(debtCoin);
    const slippage = options?.slippage ?? 0.005;
    
    console.log('=== calcAmountNeededToRepay Inputs ===');
    console.log('amount:', amount);
    console.log('debtCoinPrice:', debtCoinPrice);
    console.log('debtCoin.decimal:', debtCoin.decimal);
    console.log('collateralCoinPrice:', collateralCoinPrice);
    console.log('collateralCoin.decimal:', collateralCoin.decimal);
    console.log('flashloanFee:', flashloanFee);
    console.log('slippage:', slippage);

    const [minCollateralAmount, minSwapAmountOut] = calcAmountNeededToRepay(
        amount,
        debtCoinPrice,
        debtCoin.decimal,
        collateralCoinPrice,
        collateralCoin.decimal,
        flashloanFee,
        slippage,
    );
    
    console.log('=== calcAmountNeededToRepay Results ===');
    console.log('minCollateralAmount:', minCollateralAmount);
    console.log('minSwapAmountOut:', minSwapAmountOut);
    console.log('Results array:', [minCollateralAmount, minSwapAmountOut]);

    // use flashloan to borrow enough to repay debt
    const [flashloanBalance, receipt] = await flashloan(
        txb,
        debtPoolConfig,
        amount,
    );

    const [flashCoin]: any = txb.moveCall({
        target: "0x2::coin::from_balance",
        arguments: [flashloanBalance],
        typeArguments: [debtCoin.address],
    });

    // repay debt using flashloan
    repayDebt(txb, debtPoolConfig, flashCoin, amount);

    // withdraw enough to cover flashloan after swap
    const [withdrawnCollateralCoin] = await withdrawCoin(
        txb,
        collateralPoolConfig,
        minCollateralAmount,
    );

    let quote;
    try {
        quote = await getQuote(
            collateralCoin.address,
            debtCoin.address,
            minCollateralAmount,
            options?.apiKey,
            { baseUrl: options?.baseUrl },
        );
        console.log("Quote obtained:", quote);
    } catch (error) {
        console.error(`Failed to get quote: ${(error as Error).message}`);
        throw error;
    }

    // swap withdrawn collateral to debt coin
    const swappedCollateralCoin = await buildSwapPTBFromQuote(
        address,
        txb,
        minSwapAmountOut,
        withdrawnCollateralCoin as any,
        quote,
    );

    const repayBalance = txb.moveCall({
        target: "0x2::coin::into_balance",
        arguments: [swappedCollateralCoin],
        typeArguments: [debtCoin.address],
    });

    // repay flashloan with swapped collateral
    const [leftoverBalance] = await repayFlashLoan(
        txb,
        debtPoolConfig,
        receipt,
        repayBalance,
    );

    // transfer any extra coins to the user
    const [leftoverCoin] = txb.moveCall({
        target: "0x2::coin::from_balance",
        arguments: [leftoverBalance],
        typeArguments: [debtCoin.address],
    });
    txb.transferObjects([leftoverCoin], address);

    return txb;
}

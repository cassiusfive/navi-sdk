"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repayWithCollateral = repayWithCollateral;
const PTB_1 = require("../../libs/PTB");
const PoolInfo_1 = require("../PoolInfo");
const migrate_1 = require("./migrate");
function getPriceFromPool(pool) {
    return Number(pool.oracle.price);
}
function calcAmountNeededToRepay(amountToRepay, debtCoinPrice, debtCoinDecimals, collateralCoinPrice, collateralCoinDecimals, flashloanFee, slippage) {
    const R = (collateralCoinPrice * Math.pow(10, debtCoinDecimals)) /
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
function repayWithCollateral(txb, amount, debtCoin, collateralCoin, address, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const useFlashloan = (_a = options === null || options === void 0 ? void 0 : options.useFlashloan) !== null && _a !== void 0 ? _a : false;
        const allPools = yield (0, PoolInfo_1.getAllPools)();
        const collateralPool = allPools[collateralCoin.symbol];
        const debtPool = allPools[debtCoin.symbol];
        const collateralPoolConfig = {
            assetId: collateralPool.id,
            poolId: collateralPool.contract.pool,
            type: collateralPool.coinType,
        };
        const debtPoolConfig = {
            assetId: debtPool.id,
            poolId: debtPool.contract.pool,
            type: debtPool.coinType,
        };
        const collateralCoinPrice = getPriceFromPool(collateralPool);
        const debtCoinPrice = getPriceFromPool(debtPool);
        const flashloanFee = useFlashloan ? yield (0, migrate_1.getFlashloanFee)(debtCoin) : 0;
        const slippage = (_b = options === null || options === void 0 ? void 0 : options.slippage) !== null && _b !== void 0 ? _b : 0.005;
        const [minCollateralAmount, minSwapAmountOut] = calcAmountNeededToRepay(amount, debtCoinPrice, debtCoin.decimal, collateralCoinPrice, collateralCoin.decimal, flashloanFee, slippage);
        if (useFlashloan) {
            const [flashloanBalance, receipt] = yield (0, PTB_1.flashloan)(txb, debtPoolConfig, amount);
            const [flashCoin] = txb.moveCall({
                target: "0x2::coin::from_balance",
                arguments: [flashloanBalance],
                typeArguments: [debtCoin.address],
            });
            // repay debt using flashloan
            (0, PTB_1.repayDebt)(txb, debtPoolConfig, flashCoin, amount);
            // withdraw enough to cover flashloan after swap
            const [withdrawnCollateralCoin] = yield (0, PTB_1.withdrawCoin)(txb, collateralPoolConfig, minCollateralAmount);
            let quote;
            try {
                quote = yield (0, PTB_1.getQuote)(collateralCoin.address, debtCoin.address, minCollateralAmount, options === null || options === void 0 ? void 0 : options.apiKey, { baseUrl: options === null || options === void 0 ? void 0 : options.baseUrl });
                console.log("Quote obtained:", quote);
            }
            catch (error) {
                console.error(`Failed to get quote: ${error.message}`);
                throw error;
            }
            // swap withdrawn collateral to debt coin
            const swappedCollateralCoin = yield (0, PTB_1.buildSwapPTBFromQuote)(address, txb, minSwapAmountOut, withdrawnCollateralCoin, quote);
            const repayBalance = txb.moveCall({
                target: "0x2::coin::into_balance",
                arguments: [swappedCollateralCoin],
                typeArguments: [debtCoin.address],
            });
            // repay flashloan with swapped collateral
            const [leftoverBalance] = yield (0, PTB_1.repayFlashLoan)(txb, debtPoolConfig, receipt, repayBalance);
            // transfer any extra coins to the user
            const [leftoverCoin] = txb.moveCall({
                target: "0x2::coin::from_balance",
                arguments: [leftoverBalance],
                typeArguments: [debtCoin.address],
            });
            txb.transferObjects([leftoverCoin], address);
        }
        else {
            const [withdrawnCollateralCoin] = yield (0, PTB_1.withdrawCoin)(txb, collateralPoolConfig, minCollateralAmount);
            let quote;
            try {
                quote = yield (0, PTB_1.getQuote)(collateralCoin.address, debtCoin.address, minCollateralAmount, options === null || options === void 0 ? void 0 : options.apiKey, { baseUrl: options === null || options === void 0 ? void 0 : options.baseUrl });
                console.log("Quote obtained:", quote);
            }
            catch (error) {
                console.error(`Failed to get quote: ${error.message}`);
                throw error;
            }
            // swap withdrawn collateral to debt coin
            const swappedCollateralCoin = yield (0, PTB_1.buildSwapPTBFromQuote)(address, txb, minSwapAmountOut, withdrawnCollateralCoin, quote);
            const [repayCoin] = txb.splitCoins(swappedCollateralCoin, [amount]);
            (0, PTB_1.repayDebt)(txb, debtPoolConfig, repayCoin, amount);
            txb.transferObjects([swappedCollateralCoin], address);
        }
        return txb;
    });
}

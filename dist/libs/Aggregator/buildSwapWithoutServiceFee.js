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
exports.buildSwapWithoutServiceFee = buildSwapWithoutServiceFee;
const config_1 = require("./config");
const types_1 = require("../../types");
const cetus_1 = require("./Dex/cetus");
const turbos_1 = require("./Dex/turbos");
const KriyaV2_1 = require("./Dex/KriyaV2");
const kriyaV3_1 = require("./Dex/kriyaV3");
const aftermath_1 = require("./Dex/aftermath");
const deepbook_1 = require("./Dex/deepbook");
const bluefin_1 = require("./Dex/bluefin");
const magma_1 = require("./Dex/magma");
const vSui_1 = require("./Dex/vSui");
const haSui_1 = require("./Dex/haSui");
const momentum_1 = require("./Dex/momentum");
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
function buildSwapWithoutServiceFee(userAddress_1, txb_1, coinIn_1, quote_1, minAmountOut_1) {
    return __awaiter(this, arguments, void 0, function* (userAddress, txb, coinIn, quote, minAmountOut, referral = 0, ifPrint = true) {
        const tokenA = quote.from;
        const tokenB = quote.target;
        const allPaths = JSON.parse(JSON.stringify(quote.routes));
        if (ifPrint) {
            console.log(`tokenA: ${tokenA}, tokenB: ${tokenB}`);
        }
        const finalCoinB = txb.moveCall({
            target: "0x2::coin::zero",
            typeArguments: [tokenB],
        });
        for (let i = 0; i < allPaths.length; i++) {
            const path = allPaths[i];
            const pathCoinAmountIn = Math.floor(path.amount_in);
            const pathCoinAmountOut = path.amount_out;
            if (ifPrint) {
                console.log(`Path Index: `, i, `Amount In: `, pathCoinAmountIn, `Expected Amount Out: `, pathCoinAmountOut);
            }
            let pathTempCoin = txb.splitCoins(coinIn, [pathCoinAmountIn]);
            for (let j = 0; j < path.path.length; j++) {
                const route = path.path[j];
                const poolId = route.id;
                const provider = route.provider;
                const tempTokenA = route.from;
                const tempTokenB = route.target;
                const a2b = route.a2b;
                const typeArguments = route.info_for_ptb.typeArguments;
                let amountInPTB;
                let tuborsVersion;
                if (provider === "turbos") {
                    tuborsVersion = route.info_for_ptb.contractVersionId;
                }
                if (ifPrint) {
                    console.log(`Route Index: `, i, "-", j, `provider: `, provider, `from: `, tempTokenA, `to: `, tempTokenB);
                }
                amountInPTB = txb.moveCall({
                    target: "0x2::coin::value",
                    arguments: [pathTempCoin],
                    typeArguments: [tempTokenA],
                });
                switch (provider) {
                    case types_1.Dex.CETUS: {
                        const coinA = a2b
                            ? pathTempCoin
                            : txb.moveCall({
                                target: "0x2::coin::zero",
                                typeArguments: [tempTokenB],
                            });
                        const coinB = a2b
                            ? txb.moveCall({
                                target: "0x2::coin::zero",
                                typeArguments: [tempTokenB],
                            })
                            : pathTempCoin;
                        const coinABs = yield (0, cetus_1.makeCETUSPTB)(txb, poolId, true, coinA, coinB, amountInPTB, a2b, typeArguments);
                        if (a2b) {
                            txb.transferObjects([coinABs[0]], userAddress);
                            pathTempCoin = coinABs[1];
                        }
                        else {
                            txb.transferObjects([coinABs[1]], userAddress);
                            pathTempCoin = coinABs[0];
                        }
                        break;
                    }
                    case types_1.Dex.TURBOS: {
                        pathTempCoin = txb.makeMoveVec({
                            elements: [pathTempCoin],
                        });
                        const { turbosCoinB, turbosCoinA } = yield (0, turbos_1.makeTurbosPTB)(txb, poolId, true, pathTempCoin, amountInPTB, a2b, typeArguments, userAddress, tuborsVersion);
                        txb.transferObjects([turbosCoinA], userAddress);
                        pathTempCoin = turbosCoinB;
                        break;
                    }
                    case types_1.Dex.KRIYA_V2: {
                        pathTempCoin = yield (0, KriyaV2_1.makeKriyaV2PTB)(txb, poolId, true, pathTempCoin, amountInPTB, a2b, typeArguments);
                        break;
                    }
                    case types_1.Dex.KRIYA_V3: {
                        pathTempCoin = yield (0, kriyaV3_1.makeKriyaV3PTB)(txb, poolId, true, pathTempCoin, amountInPTB, a2b, typeArguments);
                        break;
                    }
                    case types_1.Dex.AFTERMATH: {
                        const amountLimit = route.info_for_ptb.amountLimit;
                        pathTempCoin = yield (0, aftermath_1.makeAftermathPTB)(txb, poolId, pathTempCoin, amountLimit, a2b, typeArguments);
                        break;
                    }
                    case types_1.Dex.DEEPBOOK: {
                        const amountLimit = route.info_for_ptb.amountLimit;
                        const { baseCoinOut, quoteCoinOut } = yield (0, deepbook_1.makeDeepbookPTB)(txb, poolId, pathTempCoin, amountLimit, a2b, typeArguments);
                        if (a2b) {
                            pathTempCoin = quoteCoinOut;
                            txb.transferObjects([baseCoinOut], userAddress);
                        }
                        else {
                            pathTempCoin = baseCoinOut;
                            txb.transferObjects([quoteCoinOut], userAddress);
                        }
                        break;
                    }
                    case types_1.Dex.BLUEFIN: {
                        const { coinAOut, coinBOut } = yield (0, bluefin_1.makeBluefinPTB)(txb, poolId, pathTempCoin, amountInPTB, a2b, typeArguments);
                        if (a2b) {
                            txb.transferObjects([coinAOut], userAddress);
                            pathTempCoin = coinBOut;
                        }
                        else {
                            txb.transferObjects([coinBOut], userAddress);
                            pathTempCoin = coinAOut;
                        }
                        break;
                    }
                    case types_1.Dex.MAGMA: {
                        const coinA = a2b
                            ? pathTempCoin
                            : txb.moveCall({
                                target: "0x2::coin::zero",
                                typeArguments: [tempTokenB],
                            });
                        const coinB = a2b
                            ? txb.moveCall({
                                target: "0x2::coin::zero",
                                typeArguments: [tempTokenB],
                            })
                            : pathTempCoin;
                        const coinABs = yield (0, magma_1.makeMAGMAPTB)(txb, poolId, true, coinA, coinB, amountInPTB, a2b, typeArguments);
                        if (a2b) {
                            txb.transferObjects([coinABs[0]], userAddress);
                            pathTempCoin = coinABs[1];
                        }
                        else {
                            txb.transferObjects([coinABs[1]], userAddress);
                            pathTempCoin = coinABs[0];
                        }
                        break;
                    }
                    case types_1.Dex.VSUI: {
                        pathTempCoin = yield (0, vSui_1.makeVSUIPTB)(txb, pathTempCoin, a2b);
                        break;
                    }
                    case types_1.Dex.HASUI: {
                        pathTempCoin = yield (0, haSui_1.makeHASUIPTB)(txb, pathTempCoin, a2b);
                        break;
                    }
                    case types_1.Dex.MOMENTUM: {
                        const outputCoin = yield (0, momentum_1.makeMomentumPTB)(txb, poolId, pathTempCoin, amountInPTB, a2b, typeArguments);
                        txb.transferObjects([pathTempCoin], userAddress);
                        pathTempCoin = outputCoin;
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
            txb.mergeCoins(finalCoinB, [pathTempCoin]);
        }
        txb.transferObjects([coinIn], userAddress);
        // Add slippage check
        txb.moveCall({
            target: `${config_1.AggregatorConfig.aggregatorContract}::slippage::check_slippage_v2`,
            arguments: [
                finalCoinB,
                txb.pure.u64(Math.floor(minAmountOut)),
                txb.pure.u64(quote.amount_in),
                txb.pure.u64(referral),
            ],
            typeArguments: [tokenA, tokenB],
        });
        return finalCoinB;
    });
}

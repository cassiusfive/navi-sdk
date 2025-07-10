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
exports.getCoins = getCoins;
exports.getCoinPTB = getCoinPTB;
exports.buildSwapPTBFromQuote = buildSwapPTBFromQuote;
exports.swapPTB = swapPTB;
exports.checkIfNAVIIntegrated = checkIfNAVIIntegrated;
const config_1 = require("./config");
const commonFunctions_1 = require("../PTB/commonFunctions");
const getQuote_1 = require("./getQuote");
const utils_1 = require("./utils");
const serviceFee_1 = require("./serviceFee");
const buildSwapWithoutServiceFee_1 = require("./buildSwapWithoutServiceFee");
function getCoins(client_1, address_1) {
    return __awaiter(this, arguments, void 0, function* (client, address, coinType = "0x2::sui::SUI") {
        const coinAddress = coinType.address ? coinType.address : coinType;
        const coinDetails = yield client.getCoins({
            owner: address,
            coinType: coinAddress,
        });
        return coinDetails;
    });
}
function getCoinPTB(address, coin, amountIn, txb, client) {
    return __awaiter(this, void 0, void 0, function* () {
        let coinA;
        if (coin === "0x2::sui::SUI") {
            coinA = txb.splitCoins(txb.gas, [txb.pure.u64(amountIn)]);
        }
        else {
            const coinInfo = yield getCoins(client, address, coin);
            // Check if user has enough balance for tokenA
            if (!coinInfo.data[0]) {
                throw new Error("Insufficient balance for this coin");
            }
            // Merge coins if necessary, to cover the amount needed
            const mergedCoin = (0, commonFunctions_1.returnMergedCoins)(txb, coinInfo);
            coinA = txb.splitCoins(mergedCoin, [txb.pure.u64(amountIn)]);
        }
        return coinA;
    });
}
function buildSwapPTBFromQuote(userAddress_1, txb_1, minAmountOut_1, coinIn_1, quote_1) {
    return __awaiter(this, arguments, void 0, function* (userAddress, txb, minAmountOut, coinIn, quote, referral = 0, ifPrint = true, apiKey, swapOptions) {
        if (!quote.routes || quote.routes.length === 0) {
            throw new Error("No routes found in data");
        }
        if (Number(quote.amount_in) !==
            quote.routes.reduce((sum, route) => sum + Number(route.amount_in), 0)) {
            throw new Error("Outer amount_in does not match the sum of route amount_in values");
        }
        const serviceFee = (swapOptions === null || swapOptions === void 0 ? void 0 : swapOptions.serviceFee) || (swapOptions === null || swapOptions === void 0 ? void 0 : swapOptions.feeOption);
        // Calculate fee amounts if options provided
        if (serviceFee &&
            serviceFee.fee > 0 &&
            serviceFee.receiverAddress &&
            serviceFee.receiverAddress !== "0x0") {
            const { router, serviceFeeRouter, serviceFeeCoinIn } = yield (0, serviceFee_1.handleServiceFee)(userAddress, txb, coinIn, quote, serviceFee, apiKey, swapOptions);
            const [coinOut, feeCoinOut] = yield Promise.all([
                (0, buildSwapWithoutServiceFee_1.buildSwapWithoutServiceFee)(userAddress, txb, coinIn, router, minAmountOut, referral, ifPrint),
                !!serviceFeeRouter
                    ? serviceFeeRouter.from === serviceFeeRouter.target
                        ? serviceFeeCoinIn
                        : (0, buildSwapWithoutServiceFee_1.buildSwapWithoutServiceFee)(userAddress, txb, serviceFeeCoinIn, serviceFeeRouter, 0, referral, ifPrint)
                    : new Promise((resolve) => {
                        resolve(null);
                    }),
            ]);
            if (feeCoinOut) {
                (0, serviceFee_1.emitServiceFeeEvent)(txb, coinOut, feeCoinOut, serviceFee, router, referral);
                txb.transferObjects([feeCoinOut], serviceFee.receiverAddress);
            }
            return coinOut;
        }
        return yield (0, buildSwapWithoutServiceFee_1.buildSwapWithoutServiceFee)(userAddress, txb, coinIn, quote, minAmountOut, referral, ifPrint);
    });
}
function swapPTB(address_1, txb_1, fromCoinAddress_1, toCoinAddress_1, coin_1, amountIn_1, minAmountOut_1, apiKey_1) {
    return __awaiter(this, arguments, void 0, function* (address, txb, fromCoinAddress, toCoinAddress, coin, amountIn, minAmountOut, apiKey, swapOptions = {
        baseUrl: undefined,
        dexList: [],
        byAmountIn: true,
        depth: 3,
        ifPrint: true,
    }) {
        const refId = apiKey ? (0, utils_1.generateRefId)(apiKey) : 0;
        // Get the output coin from the swap route and transfer it to the user
        const quote = yield (0, getQuote_1.getQuote)(fromCoinAddress, toCoinAddress, amountIn, apiKey, swapOptions);
        const finalCoinB = yield buildSwapPTBFromQuote(address, txb, minAmountOut, coin, quote, refId, swapOptions.ifPrint, apiKey, swapOptions);
        return finalCoinB;
    });
}
function checkIfNAVIIntegrated(digest, client) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const results = yield client.getTransactionBlock({
            digest,
            options: { showEvents: true },
        });
        return ((_b = (_a = results.events) === null || _a === void 0 ? void 0 : _a.some((event) => event.type.includes(`${config_1.AggregatorConfig.aggregatorContract}::slippage`))) !== null && _b !== void 0 ? _b : false);
    });
}

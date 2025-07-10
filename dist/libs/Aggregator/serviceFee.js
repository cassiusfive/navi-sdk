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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServiceFee = handleServiceFee;
exports.emitServiceFeeEvent = emitServiceFeeEvent;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const getQuote_1 = require("./getQuote");
const config_1 = require("./config");
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
function handleServiceFee(userAddress, txb, coinIn, quote, serviceFee, apiKey, swapOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalAmount = quote.amount_in;
        const serviceFeeAmount = new bignumber_js_1.default(totalAmount)
            .multipliedBy(serviceFee.fee)
            .toFixed(0);
        const newAmountIn = new bignumber_js_1.default(totalAmount)
            .minus(serviceFeeAmount)
            .toFixed(0);
        // split coins
        const serviceFeeCoinIn = txb.splitCoins(coinIn, [serviceFeeAmount]);
        // get router
        const [router, serviceFeeRouter] = yield Promise.all([
            (0, getQuote_1.getQuote)(quote.from, quote.target, newAmountIn, apiKey, swapOptions),
            new Promise((resolve, reject) => {
                if (serviceFeeAmount === "0") {
                    resolve(null);
                    return;
                }
                if (quote.from ===
                    "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT") {
                    resolve({
                        routes: [],
                        amount_in: serviceFeeAmount,
                        amount_out: serviceFeeAmount,
                        from: quote.from,
                        target: quote.from,
                        dexList: [],
                    });
                    return;
                }
                (0, getQuote_1.getQuote)(quote.from, "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT", serviceFeeAmount, apiKey, swapOptions)
                    .then((router) => {
                    resolve(router);
                })
                    .catch(reject);
            }),
        ]);
        if (!router.amount_out) {
            router.amount_out = "0";
        }
        if (serviceFeeRouter && !serviceFeeRouter.amount_out) {
            serviceFeeRouter.amount_out = "0";
        }
        return {
            router,
            serviceFeeRouter,
            serviceFeeCoinIn
        };
    });
}
/**
 * Emit a service fee event
 * @param txb - The transaction builder
 * @param coinOut - The output coin
 * @param feeCoinOut - The fee output coin
 * @param serviceFee - The service fee
 * @param router - The router
 * @param referral - The referral
 */
function emitServiceFeeEvent(txb, coinOut, feeCoinOut, serviceFee, router, referral) {
    var _a, _b, _c, _d;
    txb.moveCall({
        package: config_1.AggregatorConfig.aggregatorContract,
        module: "slippage",
        function: "emit_referral_event",
        arguments: [
            coinOut,
            feeCoinOut,
            txb.pure.address(serviceFee.receiverAddress),
            txb.pure.u8(((_a = router.from_token) === null || _a === void 0 ? void 0 : _a.decimals) || 9),
            txb.pure.u8(((_b = router.to_token) === null || _b === void 0 ? void 0 : _b.decimals) || 9),
            txb.pure.u8(9),
            txb.pure.u64(router.amount_in),
            txb.pure.u64(Math.floor((((_c = router.from_token) === null || _c === void 0 ? void 0 : _c.price) || 0) * 1e9)),
            txb.pure.u64(Math.floor((((_d = router.to_token) === null || _d === void 0 ? void 0 : _d.price) || 0) * 1e9)),
            txb.pure.u64((0, bignumber_js_1.default)(serviceFee.fee).multipliedBy(1e4).toFixed(0)),
            txb.pure.u64(referral),
        ],
        typeArguments: [
            router.from,
            router.target,
            "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
        ],
    });
}

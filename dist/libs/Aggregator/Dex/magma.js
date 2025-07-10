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
exports.makeMAGMAPTB = makeMAGMAPTB;
const config_1 = require("../config");
function makeMAGMAPTB(txb, poolId, byAmountIn, coinA, coinB, amount, a2b, typeArguments) {
    return __awaiter(this, void 0, void 0, function* () {
        let coinTypeA = typeArguments[0];
        let coinTypeB = typeArguments[1];
        const sqrtPriceLimit = BigInt(a2b ? "4295048016" : "79226673515401279992447579055");
        const coinABs = txb.moveCall({
            target: `${config_1.AggregatorConfig.magmaPackageId}::router::swap`,
            arguments: [
                txb.object(config_1.AggregatorConfig.magmaConfigId),
                txb.object(poolId),
                coinA,
                coinB,
                txb.pure.bool(a2b),
                txb.pure.bool(byAmountIn),
                amount,
                txb.pure.u128(sqrtPriceLimit),
                txb.pure.bool(false),
                txb.object(config_1.AggregatorConfig.clockAddress),
            ],
            typeArguments: [coinTypeA, coinTypeB],
        });
        return coinABs;
    });
}

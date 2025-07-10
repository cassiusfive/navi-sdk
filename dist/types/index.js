"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3Type = exports.Dex = exports.OptionType = void 0;
var OptionType;
(function (OptionType) {
    OptionType[OptionType["OptionSupply"] = 1] = "OptionSupply";
    OptionType[OptionType["OptionWithdraw"] = 2] = "OptionWithdraw";
    OptionType[OptionType["OptionBorrow"] = 3] = "OptionBorrow";
    OptionType[OptionType["OptionRepay"] = 4] = "OptionRepay";
})(OptionType || (exports.OptionType = OptionType = {}));
var Dex;
(function (Dex) {
    Dex["CETUS"] = "cetus";
    Dex["TURBOS"] = "turbos";
    Dex["KRIYA_V2"] = "kriyaV2";
    Dex["KRIYA_V3"] = "kriyaV3";
    Dex["AFTERMATH"] = "aftermath";
    Dex["DEEPBOOK"] = "deepbook";
    Dex["BLUEFIN"] = "bluefin";
    Dex["VSUI"] = "vSui";
    Dex["HASUI"] = "haSui";
    Dex["MAGMA"] = "magma";
    Dex["MOMENTUM"] = "momentum";
})(Dex || (exports.Dex = Dex = {}));
exports.V3Type = __importStar(require("./V3"));

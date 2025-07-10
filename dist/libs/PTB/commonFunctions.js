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
exports.depositCoin = depositCoin;
exports.depositCoinWithAccountCap = depositCoinWithAccountCap;
exports.withdrawCoin = withdrawCoin;
exports.withdrawCoinWithAccountCap = withdrawCoinWithAccountCap;
exports.borrowCoin = borrowCoin;
exports.repayDebt = repayDebt;
exports.getHealthFactorPTB = getHealthFactorPTB;
exports.returnMergedCoins = returnMergedCoins;
exports.flashloan = flashloan;
exports.repayFlashLoan = repayFlashLoan;
exports.liquidateFunction = liquidateFunction;
exports.SignAndSubmitTXB = SignAndSubmitTXB;
exports.stakeTovSuiPTB = stakeTovSuiPTB;
exports.unstakeTovSui = unstakeTovSui;
exports.getAvailableRewards = getAvailableRewards;
exports.claimAllRewardsPTB = claimAllRewardsPTB;
exports.claimRewardsByAssetIdPTB = claimRewardsByAssetIdPTB;
exports.claimAllRewardsResupplyPTB = claimAllRewardsResupplyPTB;
exports.updateOraclePTB = updateOraclePTB;
exports.registerStructs = registerStructs;
const transactions_1 = require("@mysten/sui/transactions");
const address_1 = require("../../address");
const bcs_1 = require("@mysten/sui.js/bcs");
const pyth_sui_js_1 = require("@pythnetwork/pyth-sui-js");
const V3 = __importStar(require("./V3"));
const V2 = __importStar(require("./V2"));
/**
 * Deposits a specified amount of a coin into a pool.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the coin you own.
 * @param amount - The amount of the coin to deposit.
 * @returns The updated transaction block object.
 */
function depositCoin(txb, _pool, coinObject, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        let amountObj;
        if (typeof amount === 'number') {
            amountObj = txb.pure.u64(amount);
        }
        else {
            amountObj = amount;
        }
        txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::entry_deposit`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                coinObject, // the object id of the Coin you own.
                amountObj, // The amount you want to deposit, decimals must be carried, like 1 sui => 1000000000
                txb.object(config.IncentiveV2),
                txb.object(config.IncentiveV3), // The incentive object v3
            ],
            typeArguments: [_pool.type]
        });
        return txb;
    });
}
/**
 * Deposits a coin with account cap.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the coin you own.
 * @param account - The account to deposit the coin into.
 * @returns The updated transaction block object.
 */
function depositCoinWithAccountCap(txb, _pool, coinObject, account) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::deposit_with_account_cap`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                coinObject, // the object id of the Coin you own.
                txb.object(config.IncentiveV2),
                txb.object(config.IncentiveV3), // The incentive object v3
                txb.object(account)
            ],
            typeArguments: [_pool.type]
        });
        return txb;
    });
}
/**
 * Withdraws a specified amount of coins from a pool.
 *
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param amount - The amount of coins to withdraw.
 * @returns The updated transaction block object.
 */
function withdrawCoin(txb, _pool, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const [ret] = txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::withdraw`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.PriceOracle), // object id of oracle
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                txb.pure.u64(amount), // The amount you want to withdraw, decimals must be carried, like 1 sui => 1000000000
                txb.object(config.IncentiveV2),
                txb.object(config.IncentiveV3), // The incentive object v3
            ],
            typeArguments: [_pool.type]
        });
        //Transfer withdraw
        const [coin] = txb.moveCall({
            target: `0x2::coin::from_balance`,
            arguments: [ret],
            typeArguments: [_pool.type]
        });
        return [coin];
    });
}
/**
 * Withdraws a specified amount of coins from an account with an account cap.
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object.
 * @param account - The account from which to withdraw the coins.
 * @param withdrawAmount - The amount of coins to withdraw.
 * @param sender - The sender of the transaction.
 */
function withdrawCoinWithAccountCap(txb, _pool, account, withdrawAmount, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const [ret] = txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::withdraw_with_account_cap`,
            arguments: [
                txb.sharedObjectRef({
                    objectId: '0x06',
                    initialSharedVersion: 1,
                    mutable: false,
                }), // clock object id
                txb.object(config.PriceOracle), // object id of oracle
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                txb.pure.u64(withdrawAmount), // The amount you want to withdraw, decimals must be carried, like 1 sui => 1000000000
                txb.object(config.IncentiveV2),
                txb.object(config.IncentiveV3), // The incentive object v3
                txb.object(account)
            ],
            typeArguments: [_pool.type]
        });
        // const [ret] = txb.moveCall({ target: `${config.ProtocolPackage}::lending::create_account` });
        const [coin] = txb.moveCall({
            target: `0x2::coin::from_balance`,
            arguments: [txb.object(ret)],
            typeArguments: [_pool.type]
        });
        return [coin];
    });
}
/**
 * Borrows a specified amount of coins from a pool.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param borrowAmount - The amount of coins to borrow.
 * @returns The updated transaction block object.
 */
function borrowCoin(txb, _pool, borrowAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const [ret] = txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::borrow`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.PriceOracle), // object id of oracle
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                txb.pure.u64(borrowAmount), // The amount you want to borrow, decimals must be carried, like 1 sui => 1000000000
                txb.object(config.IncentiveV2), // The incentive object v2
                txb.object(config.IncentiveV3), // The incentive object v3
            ],
            typeArguments: [_pool.type]
        });
        const [coin] = txb.moveCall({
            target: `0x2::coin::from_balance`,
            arguments: [txb.object(ret)],
            typeArguments: [_pool.type]
        });
        return [coin];
    });
}
/**
 * Repays a debt in the protocol.
 * @param txb - The transaction block object.
 * @param _pool - The pool configuration object.
 * @param coinObject - The object representing the Coin you own.
 * @param repayAmount - The amount you want to repay.
 * @returns The updated transaction block object.
 */
function repayDebt(txb, _pool, coinObject, repayAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        let amountObj;
        if (typeof repayAmount === 'number') {
            amountObj = txb.pure.u64(repayAmount);
        }
        else {
            amountObj = repayAmount;
        }
        txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::entry_repay`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.PriceOracle), // object id of oracle
                txb.object(config.StorageId), // object id of storage
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u8(_pool.assetId), // the id of the asset in the protocol
                coinObject, // the object id of the Coin you own.
                amountObj, // The amount you want to borrow, decimals must be carried, like 1 sui => 1000000000
                txb.object(config.IncentiveV2), // The incentive object v2 
                txb.object(config.IncentiveV3), // The incentive object v3
            ],
            typeArguments: [_pool.type]
        });
        return txb;
    });
}
/**
 * Retrieves the health factor for a given address.
 * @param txb - The Transaction object.
 * @param address - The address for which to retrieve the health factor.
 * @returns The health factor balance.
 */
function getHealthFactorPTB(txb, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const balance = txb.moveCall({
            target: `${config.ProtocolPackage}::logic::user_health_factor`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.StorageId), // object id of storage
                txb.object(config.PriceOracle), // Object id of Price Oracle
                txb.pure.address(address)
            ],
        });
        return balance;
    });
}
/**
 * Merges multiple coins into a single coin object.
 *
 * @param txb - The transaction block object.
 * @param coinInfo - The coin information object.
 * @returns The merged coin object.
 */
function returnMergedCoins(txb, coinInfo) {
    if (coinInfo.data.length >= 2) {
        let baseObj = coinInfo.data[0].coinObjectId;
        let all_list = coinInfo.data.slice(1).map((coin) => coin.coinObjectId);
        txb.mergeCoins(baseObj, all_list);
    }
    let mergedCoinObject = txb.object(coinInfo.data[0].coinObjectId);
    return mergedCoinObject;
}
/**
 * Executes a flash loan transaction.
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object representing the pool.
 * @param amount - The amount of the flash loan.
 * @returns An array containing the balance and receipt of the flash loan transaction.
 */
function flashloan(txb, _pool, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const [balance, receipt] = txb.moveCall({
            target: `${config.ProtocolPackage}::lending::flash_loan_with_ctx`,
            arguments: [
                txb.object(address_1.flashloanConfig.id), // clock object id
                txb.object(_pool.poolId), // pool id of the asset
                txb.pure.u64(amount), // the id of the asset in the protocol
            ],
            typeArguments: [_pool.type]
        });
        return [balance, receipt];
    });
}
/**
 * Repays a flash loan by calling the flash_repay_with_ctx function in the lending protocol.
 *
 * @param txb - The Transaction object.
 * @param _pool - The PoolConfig object representing the pool.
 * @param receipt - The receipt object.
 * @param repayCoin - The asset ID of the asset to be repaid.
 * @returns The balance after the flash loan is repaid.
 */
function repayFlashLoan(txb, _pool, receipt, repayCoin) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const [balance] = txb.moveCall({
            target: `${config.ProtocolPackage}::lending::flash_repay_with_ctx`,
            arguments: [
                txb.object('0x06'), // clock object id
                txb.object(config.StorageId),
                txb.object(_pool.poolId), // pool id of the asset
                receipt,
                repayCoin, // the id of the asset in the protocol
            ],
            typeArguments: [_pool.type]
        });
        return [balance];
    });
}
/**
 * Liquidates a transaction block.
 * @param txb - The transaction block to be liquidated.
 * @param payCoinType - The type of coin to be paid.
 * @param payCoinObj - The payment coin object.
 * @param collateralCoinType - The type of collateral coin.
 * @param to_liquidate_address - The address to which the liquidated amount will be sent.
 * @param to_liquidate_amount - The amount to be liquidated.
 * @returns An array containing the collateral coin and the remaining debt coin.
 */
function liquidateFunction(txb, payCoinType, payCoinObj, collateralCoinType, to_liquidate_address, to_liquidate_amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool_to_pay = address_1.pool[payCoinType.symbol];
        const collateral_pool = address_1.pool[collateralCoinType.symbol];
        const config = yield (0, address_1.getConfig)();
        const [collateralBalance, remainDebtBalance] = txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::liquidation`,
            arguments: [
                txb.object('0x06'),
                txb.object(config.PriceOracle),
                txb.object(config.StorageId),
                txb.pure.u8(pool_to_pay.assetId),
                txb.object(pool_to_pay.poolId),
                payCoinObj,
                txb.pure.u8(collateral_pool.assetId),
                txb.object(collateral_pool.poolId),
                txb.pure.address(to_liquidate_address),
                txb.object(config.IncentiveV2),
                txb.object(config.IncentiveV3),
            ],
            typeArguments: [pool_to_pay.type, collateral_pool.type],
        });
        return [collateralBalance, remainDebtBalance];
    });
}
/**
 * Signs and submits a transaction block using the provided client and keypair.
 * @param txb - The transaction block to sign and submit.
 * @param client - The client object used to sign and execute the transaction block.
 * @param keypair - The keypair used as the signer for the transaction block.
 * @returns A promise that resolves to the result of signing and executing the transaction block.
 */
function SignAndSubmitTXB(txb, client, keypair) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.signAndExecuteTransaction({
            transaction: txb,
            signer: keypair,
            requestType: 'WaitForLocalExecution',
            options: {
                showEffects: true
            }
        });
        return result;
    });
}
/**
 * Stakes a given SUI coin object to the vSUI pool.
 * @param txb The transaction block object.
 * @param suiCoinObj The SUI coin object to be staked.
 * @returns vSui coin object.
 */
function stakeTovSuiPTB(txb, suiCoinObj) {
    return __awaiter(this, void 0, void 0, function* () {
        const [coin] = txb.moveCall({
            target: `${address_1.vSuiConfig.ProtocolPackage}::stake_pool::stake`,
            arguments: [
                txb.object(address_1.vSuiConfig.pool),
                txb.object(address_1.vSuiConfig.metadata),
                txb.object(address_1.vSuiConfig.wrapper),
                suiCoinObj,
            ],
            typeArguments: [],
        });
        return coin;
    });
}
/**
 * Unstakes TOV SUI coins.
 * @param txb - The transaction block object.
 * @param vSuiCoinObj - The vSui coin object.
 * @returns The unstaked Sui coin.
 */
function unstakeTovSui(txb, vSuiCoinObj) {
    return __awaiter(this, void 0, void 0, function* () {
        const [coin] = txb.moveCall({
            target: `${address_1.vSuiConfig.ProtocolPackage}::stake_pool::unstake`,
            arguments: [
                txb.object(address_1.vSuiConfig.pool),
                txb.object(address_1.vSuiConfig.metadata),
                txb.object(address_1.vSuiConfig.wrapper),
                vSuiCoinObj,
            ],
            typeArguments: [],
        });
        return coin;
    });
}
/**
 * Retrieves available rewards for the given address.
 *
 * @param client - Sui client instance.
 * @param checkAddress - The address for which rewards are being checked.
 * @param contractOptionTypes - Array of contract option types to filter rewards (e.g., [1], [3], or [1,3]).
 *                              When passing [1], only supply rewards will be returned.
 *                              When passing [3], only borrow rewards will be returned.
 *                              When passing [1,3], rewards for both options will be returned.
 * @param prettyPrint - Flag to determine if the result should be pretty printed.
 * @param includeV2 - Feature flag to enable/disable V2 logic.
 * @returns Promise resolving to an array of aggregated PoolRewards.
 */
function getAvailableRewards(client_1, checkAddress_1, contractOptionTypes_1) {
    return __awaiter(this, arguments, void 0, function* (client, checkAddress, contractOptionTypes, // Use ContractOptionType[] if you have a dedicated type
    prettyPrint = true, includeV2 = false // Feature flag to enable/disable V2 logic
    ) {
        // Concurrently fetch rewards data for V2 (option 1 and/or 3) and V3.
        const v2Promises = [];
        // Fetch V2 rewards for option 1 if requested and if V2 is enabled, else resolve to null.
        if (includeV2 && contractOptionTypes.includes(1)) {
            v2Promises.push(V2.getAvailableRewards(client, checkAddress, 1, prettyPrint));
        }
        else {
            v2Promises.push(Promise.resolve(null));
        }
        // Fetch V2 rewards for option 3 if requested and if V2 is enabled, else resolve to null.
        if (includeV2 && contractOptionTypes.includes(3)) {
            v2Promises.push(V2.getAvailableRewards(client, checkAddress, 3, prettyPrint));
        }
        else {
            v2Promises.push(Promise.resolve(null));
        }
        // Fetch V3 rewards data.
        const v3Promise = V3.getAvailableRewards(client, checkAddress, prettyPrint);
        const [v2DataOpt1, v2DataOpt3, v3Data] = yield Promise.all([
            v2Promises[0],
            v2Promises[1],
            v3Promise
        ]);
        // Aggregation map; key format: `${assetId}-${rewardType}-${reward_coin_type}`
        const agg = new Map();
        // Process V2 data with the corresponding rewardType (option).
        const processV2Data = (v2Data, rewardType) => {
            if (!v2Data)
                return;
            for (const [assetIdKey, entry] of Object.entries(v2Data)) {
                const assetId = parseInt(entry.asset_id, 10); // assetId is taken from the key
                const value = parseFloat(entry.available);
                if (agg.has(assetIdKey)) {
                    agg.get(assetIdKey).total += value;
                }
                else {
                    agg.set(assetIdKey, { assetId, rewardType, coinType: entry.reward_coin_type, total: value });
                }
            }
        };
        processV2Data(v2DataOpt1, 1);
        processV2Data(v2DataOpt3, 3);
        // Process V3 data, filtering based on contractOptionTypes.
        if (v3Data) {
            for (const entries of Object.values(v3Data)) {
                for (const entry of entries) {
                    // Skip entry if its option is not in the provided contractOptionTypes.
                    if (!contractOptionTypes.includes(entry.option))
                        continue;
                    const assetId = parseInt(entry.asset_id, 10);
                    const rewardType = entry.option;
                    const key = `${assetId}-${rewardType}-${entry.reward_coin_type}`;
                    if (agg.has(key)) {
                        agg.get(key).total += entry.user_claimable_reward;
                    }
                    else {
                        agg.set(key, { assetId, rewardType, coinType: entry.reward_coin_type, total: entry.user_claimable_reward });
                    }
                }
            }
        }
        // Group the rewards by assetId and rewardType. The group key is `${assetId}-${rewardType}`.
        const groupMap = new Map();
        for (const { assetId, rewardType, coinType, total } of agg.values()) {
            const groupKey = `${assetId}-${rewardType}`;
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, { assetId, rewardType, rewards: new Map() });
            }
            const rewardMap = groupMap.get(groupKey);
            rewardMap.rewards.set(coinType, (rewardMap.rewards.get(coinType) || 0) + total);
        }
        // Construct the final result array.
        return Array.from(groupMap.values()).map(group => ({
            assetId: group.assetId,
            rewardType: group.rewardType,
            rewards: Array.from(group.rewards.entries()).map(([coinType, available]) => ({
                coinType,
                available: available.toFixed(6),
            })),
        }));
    });
}
/**
   * Claims all available rewards for the specified account.
   * @returns PTB result
   */
function claimAllRewardsPTB(client, userToCheck, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        let tx = existingTx || new transactions_1.Transaction();
        // await V2.claimAllRewardsPTB(client, userToCheck, tx)
        yield V3.claimAllRewardsPTB(client, userToCheck, tx);
        return tx;
    });
}
/**
   * Claims available rewards by asset ID for the specified account.
   * @returns PTB result
   */
function claimRewardsByAssetIdPTB(client, userToCheck, assetId, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        let tx = existingTx || new transactions_1.Transaction();
        // await V2.claimRewardsByAssetIdPTB(client, userToCheck, assetId, tx)
        yield V3.claimRewardsByAssetIdPTB(client, userToCheck, assetId, tx);
        return tx;
    });
}
/**
   * Claims all available rewards for the specified account.
   * @returns PTB result
   */
function claimAllRewardsResupplyPTB(client, userToCheck, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        let tx = existingTx || new transactions_1.Transaction();
        // await V2.claimAllRewardsResupplyPTB(client, userToCheck, tx)
        yield V3.claimAllRewardsResupplyPTB(client, userToCheck, tx);
        return tx;
    });
}
/**
 * Represents a connection to the SuiPriceService.
 *
 * @remarks
 * This connection is used to communicate with the SuiPriceService API.
 *
 * @param url - The URL of the SuiPriceService API.
 * @param options - Optional configuration options for the connection.
 * @returns A new instance of the SuiPriceServiceConnection.
 */
const suiPythConnection = new pyth_sui_js_1.SuiPriceServiceConnection('https://hermes.pyth.network', { timeout: 20000 });
/**
 * Retrieves the stale price feed IDs from the given array of price IDs.
 *
 * @param priceIds - An array of price IDs.
 * @returns A promise that resolves to an array of stale price feed IDs.
 * @throws If there is an error while retrieving the stale price feed IDs.
 */
function getPythStalePriceFeedId(priceIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const returnData = [];
            const latestPriceFeeds = yield suiPythConnection.getLatestPriceFeeds(priceIds);
            if (!latestPriceFeeds)
                return returnData;
            const currentTimestamp = Math.floor(new Date().valueOf() / 1000);
            for (const priceFeed of latestPriceFeeds) {
                const uncheckedPrice = priceFeed.getPriceUnchecked();
                if (uncheckedPrice.publishTime > currentTimestamp) {
                    console.warn(`pyth price feed is invalid, id: ${priceFeed.id}, publish time: ${uncheckedPrice.publishTime}, current timestamp: ${currentTimestamp}`);
                    continue;
                }
                // From pyth state is 60, but setting it to 30 makes more sense.
                if (currentTimestamp - priceFeed.getPriceUnchecked().publishTime > 30) {
                    console.info(`stale price feed, id: ${priceFeed.id}, publish time: ${uncheckedPrice.publishTime}, current timestamp: ${currentTimestamp}`);
                    returnData.push(priceFeed.id);
                }
            }
            return returnData;
        }
        catch (error) {
            throw new Error(`failed to get pyth stale price feed id, msg: ${error.message}`);
        }
    });
}
/**
 * Updates the single price in the transaction.
 *
 * @param txb - The transaction object.
 * @param input - The input object containing the feedId and pythPriceInfoObject.
 */
function updateSinglePrice(txb, input) {
    txb.moveCall({
        target: `${address_1.OracleProConfig.PackageId}::oracle_pro::update_single_price`,
        arguments: [
            txb.object('0x6'),
            txb.object(address_1.OracleProConfig.OracleConfig),
            txb.object(address_1.OracleProConfig.PriceOracle),
            txb.object(address_1.OracleProConfig.SupraOracleHolder),
            txb.object(input.pythPriceInfoObject),
            txb.pure.address(input.feedId),
        ],
    });
}
/**
 * Updates the Pyth price feeds.
 *
 * @param client - The SuiClient object.
 * @param txb - The Transaction object.
 * @param priceFeedIds - An array of price feed IDs.
 * @returns A Promise that resolves to the result of updating the price feeds.
 * @throws If there is an error updating the price feeds.
 */
function updatePythPriceFeeds(client, txb, priceFeedIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const priceUpdateData = yield suiPythConnection.getPriceFeedsUpdateData(priceFeedIds);
            const suiPythClient = new pyth_sui_js_1.SuiPythClient(client, address_1.OracleProConfig.PythStateId, address_1.OracleProConfig.WormholeStateId);
            return yield suiPythClient.updatePriceFeeds(txb, priceUpdateData, priceFeedIds);
        }
        catch (error) {
            throw new Error(`failed to update pyth price feeds, msg: ${error.message}`);
        }
    });
}
/**
 * Updates the price of the given transaction using the provided client.
 *
 * @param client - The SuiClient used to update the price.
 * @param txb - The Transaction to update the price for.
 * @returns A Promise that resolves once the price has been updated.
 */
function updateOraclePTB(client, txb) {
    return __awaiter(this, void 0, void 0, function* () {
        const pythPriceFeedIds = Object.keys(address_1.PriceFeedConfig).map((key) => address_1.PriceFeedConfig[key].pythPriceFeedId);
        const stalePriceFeedIds = yield getPythStalePriceFeedId(pythPriceFeedIds);
        if (stalePriceFeedIds.length > 0) {
            yield updatePythPriceFeeds(client, txb, stalePriceFeedIds);
            console.info(`request update pyth price feed, ids: ${stalePriceFeedIds}`);
        }
        updateSinglePrice(txb, address_1.PriceFeedConfig.SUI);
        updateSinglePrice(txb, address_1.PriceFeedConfig.WUSDC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.USDT);
        updateSinglePrice(txb, address_1.PriceFeedConfig.WETH);
        updateSinglePrice(txb, address_1.PriceFeedConfig.CETUS);
        updateSinglePrice(txb, address_1.PriceFeedConfig.CERT);
        updateSinglePrice(txb, address_1.PriceFeedConfig.HASUI);
        updateSinglePrice(txb, address_1.PriceFeedConfig.NAVX);
        updateSinglePrice(txb, address_1.PriceFeedConfig.WBTC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.AUSD);
        updateSinglePrice(txb, address_1.PriceFeedConfig.NUSDC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.ETH);
        updateSinglePrice(txb, address_1.PriceFeedConfig.USDY);
        updateSinglePrice(txb, address_1.PriceFeedConfig.NS);
        updateSinglePrice(txb, address_1.PriceFeedConfig.LORENZOBTC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.DEEP);
        updateSinglePrice(txb, address_1.PriceFeedConfig.FDUSD);
        updateSinglePrice(txb, address_1.PriceFeedConfig.BLUE);
        updateSinglePrice(txb, address_1.PriceFeedConfig.BUCK);
        updateSinglePrice(txb, address_1.PriceFeedConfig.SUIUSDT);
        updateSinglePrice(txb, address_1.PriceFeedConfig.STSUI);
        updateSinglePrice(txb, address_1.PriceFeedConfig.SUIBTC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.WSOL);
        updateSinglePrice(txb, address_1.PriceFeedConfig.LBTC);
        updateSinglePrice(txb, address_1.PriceFeedConfig.WAL);
        updateSinglePrice(txb, address_1.PriceFeedConfig.HAEDAL);
        updateSinglePrice(txb, address_1.PriceFeedConfig.XBTC);
    });
}
/**
 * Registers the required struct types for the PTB common functions.
 */
function registerStructs() {
    /**
     * Represents the information about the APY (Annual Percentage Yield) for an incentive.
     * @typedef {Object} IncentiveAPYInfo
     * @property {string} asset_id - The ID of the asset.
     * @property {string} apy - The APY value.
     * @property {string[]} coin_types - The types of coins.
     */
    bcs_1.bcs.registerStructType('IncentiveAPYInfo', {
        asset_id: 'u8',
        apy: 'u256',
        coin_types: 'vector<string>',
    });
    /**
     * Represents the information about an incentive pool.
     * @typedef {Object} IncentivePoolInfo
     * @property {string} pool_id - The ID of the pool.
     * @property {string} funds - The funds available in the pool.
     * @property {number} phase - The phase of the pool.
     * @property {number} start_at - The start time of the pool.
     * @property {number} end_at - The end time of the pool.
     * @property {number} closed_at - The time when the pool was closed.
     * @property {number} total_supply - The total supply of the pool.
     * @property {string} asset_id - The ID of the asset.
     * @property {number} option - The option of the pool.
     * @property {string} factor - The factor of the pool.
     * @property {number} distributed - The distributed amount from the pool.
     * @property {string} available - The available amount in the pool.
     * @property {string} total - The total amount in the pool.
     */
    bcs_1.bcs.registerStructType('IncentivePoolInfo', {
        pool_id: 'address',
        funds: 'address',
        phase: 'u64',
        start_at: 'u64',
        end_at: 'u64',
        closed_at: 'u64',
        total_supply: 'u64',
        asset_id: 'u8',
        option: 'u8',
        factor: 'u256',
        distributed: 'u64',
        available: 'u256',
        total: 'u256',
    });
    /**
     * Represents the information about an incentive pool by phase.
     * @typedef {Object} IncentivePoolInfoByPhase
     * @property {number} phase - The phase of the pool.
     * @property {IncentivePoolInfo[]} pools - The list of pools in the phase.
     */
    bcs_1.bcs.registerStructType('IncentivePoolInfoByPhase', {
        phase: 'u64',
        pools: 'vector<IncentivePoolInfo>',
    });
    /**
     * Represents the information about the user's state.
     * @typedef {Object} UserStateInfo
     * @property {string} asset_id - The ID of the asset.
     * @property {string} borrow_balance - The borrow balance of the user.
     * @property {string} supply_balance - The supply balance of the user.
     */
    bcs_1.bcs.registerStructType('UserStateInfo', {
        asset_id: 'u8',
        borrow_balance: 'u256',
        supply_balance: 'u256',
    });
    /**
     * Represents the information about the reserve data.
     * @typedef {Object} ReserveDataInfo
     * @property {number} id - The ID of the reserve.
     * @property {number} oracle_id - The ID of the oracle.
     * @property {string} coin_type - The type of the coin.
     * @property {string} supply_cap - The supply cap of the reserve.
     * @property {string} borrow_cap - The borrow cap of the reserve.
     * @property {string} supply_rate - The supply rate of the reserve.
     * @property {string} borrow_rate - The borrow rate of the reserve.
     * @property {string} supply_index - The supply index of the reserve.
     * @property {string} borrow_index - The borrow index of the reserve.
     * @property {string} total_supply - The total supply of the reserve.
     * @property {string} total_borrow - The total borrow of the reserve.
     * @property {number} last_update_at - The last update time of the reserve.
     * @property {string} ltv - The loan-to-value ratio of the reserve.
     * @property {string} treasury_factor - The treasury factor of the reserve.
     * @property {string} treasury_balance - The treasury balance of the reserve.
     * @property {string} base_rate - The base rate of the reserve.
     * @property {string} multiplier - The multiplier of the reserve.
     * @property {string} jump_rate_multiplier - The jump rate multiplier of the reserve.
     * @property {string} reserve_factor - The reserve factor of the reserve.
     * @property {string} optimal_utilization - The optimal utilization of the reserve.
     * @property {string} liquidation_ratio - The liquidation ratio of the reserve.
     * @property {string} liquidation_bonus - The liquidation bonus of the reserve.
     * @property {string} liquidation_threshold - The liquidation threshold of the reserve.
     */
    bcs_1.bcs.registerStructType('ReserveDataInfo', {
        id: 'u8',
        oracle_id: 'u8',
        coin_type: 'string',
        supply_cap: 'u256',
        borrow_cap: 'u256',
        supply_rate: 'u256',
        borrow_rate: 'u256',
        supply_index: 'u256',
        borrow_index: 'u256',
        total_supply: 'u256',
        total_borrow: 'u256',
        last_update_at: 'u64',
        ltv: 'u256',
        treasury_factor: 'u256',
        treasury_balance: 'u256',
        base_rate: 'u256',
        multiplier: 'u256',
        jump_rate_multiplier: 'u256',
        reserve_factor: 'u256',
        optimal_utilization: 'u256',
        liquidation_ratio: 'u256',
        liquidation_bonus: 'u256',
        liquidation_threshold: 'u256',
    });
    bcs_1.bcs.registerStructType('OracleInfo', {
        oracle_id: 'u8',
        price: 'u256',
        decimals: 'u8',
        valid: 'bool',
    });
}

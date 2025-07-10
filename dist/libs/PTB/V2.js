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
exports.getIncentivePools = getIncentivePools;
exports.getAvailableRewards = getAvailableRewards;
exports.claimAllRewardsPTB = claimAllRewardsPTB;
exports.claimRewardsByAssetIdPTB = claimRewardsByAssetIdPTB;
exports.claimRewardFunction = claimRewardFunction;
exports.claimAllRewardsResupplyPTB = claimAllRewardsResupplyPTB;
exports.claimRewardResupplyFunction = claimRewardResupplyFunction;
exports.getIncentivePoolsByPhase = getIncentivePoolsByPhase;
const transactions_1 = require("@mysten/sui/transactions");
const address_1 = require("../../address");
const utils_1 = require("@mysten/sui/utils");
const CallFunctions_1 = require("../CallFunctions");
const commonFunctions_1 = require("./commonFunctions");
const commonFunctions_2 = require("./commonFunctions");
/**
 * Retrieves the incentive pools for a given asset and option.
 * @param assetId - The ID of the asset.
 * @param option - The option type.
 * @param user - (Optional) The user's address. If provided, the rewards claimed by the user and the total rewards will be returned.
 * @returns The incentive pools information.
 */
function getIncentivePools(client, assetId, option, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const tx = new transactions_1.Transaction();
        // await updateOraclePTB(client, tx);
        const result = yield (0, CallFunctions_1.moveInspect)(tx, client, user, `${config.uiGetter}::incentive_getter::get_incentive_pools`, [
            tx.object("0x06"), // clock object id
            tx.object(config.IncentiveV2), // the incentive object v2
            tx.object(config.StorageId), // object id of storage
            tx.pure.u8(assetId),
            tx.pure.u8(option),
            tx.pure.address(user), // If you provide your address, the rewards that have been claimed by your address and the total rewards will be returned.
        ], [], // type arguments is null
        "vector<IncentivePoolInfo>" // parse type
        );
        return result[0];
    });
}
/**
 * Retrieves the available rewards for a given address.
 *
 * @param checkAddress - The address to check for rewards. Defaults to the current address.
 * @param option - The option type. Defaults to 1.
 * @param prettyPrint - Whether to print the rewards in a pretty format. Defaults to true.
 * @returns An object containing the summed rewards for each asset.
 * @throws If there is an error retrieving the available rewards.
 */
function getAvailableRewards(client_1, checkAddress_1) {
    return __awaiter(this, arguments, void 0, function* (client, checkAddress, option = 1, prettyPrint = true) {
        (0, commonFunctions_1.registerStructs)();
        const assetIds = Array.from({ length: Number(Object.keys(address_1.pool).length) }, (_, i) => i);
        try {
            // Fetch incentive pools for each asset ID
            const incentivePools = yield Promise.all(assetIds.map((assetId) => getIncentivePools(client, assetId, option, checkAddress)));
            const allPools = incentivePools.flat();
            // Filter active pools with available rewards
            const activePools = allPools.filter((pool) => pool.available.trim() !== "0");
            const fundIds = [...new Set(activePools.map((item) => item.funds))];
            // Fetch fund details
            const funds = yield client.multiGetObjects({
                ids: fundIds,
                options: { showContent: true },
            });
            // Extract relevant data
            const fundDetails = funds.map((item) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                return ({
                    funds: (_a = item === null || item === void 0 ? void 0 : item.data) === null || _a === void 0 ? void 0 : _a.objectId,
                    reward_coin_type: (_f = (_e = (_d = (_c = (_b = item.data) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.coin_type) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f.name,
                    reward_coin_oracle_id: (_j = (_h = (_g = item.data) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j.oracle_id,
                });
            });
            // Merge extracted data with active pools
            const mergedPools = activePools.map((pool) => {
                var _a, _b;
                const matchedFund = fundDetails.find((fund) => fund.funds === `0x${pool.funds}`);
                return Object.assign(Object.assign({}, pool), { reward_coin_type: (_a = matchedFund === null || matchedFund === void 0 ? void 0 : matchedFund.reward_coin_type) !== null && _a !== void 0 ? _a : null, reward_coin_oracle_id: (_b = matchedFund === null || matchedFund === void 0 ? void 0 : matchedFund.reward_coin_oracle_id) !== null && _b !== void 0 ? _b : null });
            });
            // Build price feed map
            const priceFeedMap = Object.values(address_1.PriceFeedConfig).reduce((acc, feed) => {
                acc[feed.coinType] = feed.priceDecimal;
                return acc;
            }, {});
            const processedData = mergedPools.reduce((acc, pool) => {
                var _a, _b, _c, _d, _e;
                const priceDecimal = (_a = priceFeedMap[`0x${pool.reward_coin_type}`]) !== null && _a !== void 0 ? _a : null;
                const availableDecimal = priceDecimal !== null
                    ? Number(BigInt(pool.available) / BigInt(Math.pow(10, 27))) /
                        Math.pow(10, priceDecimal)
                    : null;
                const assetId = parseInt(pool.asset_id, 10);
                const key = `${assetId}-${option}-${pool.reward_coin_type}`;
                if (acc[key]) {
                    const existingAvailable = parseFloat(acc[key].available);
                    const newAvailable = parseFloat((_b = availableDecimal === null || availableDecimal === void 0 ? void 0 : availableDecimal.toFixed(6)) !== null && _b !== void 0 ? _b : "0");
                    acc[key].available = (existingAvailable + newAvailable).toFixed(6);
                }
                else {
                    // if not existing
                    acc[key] = {
                        asset_id: assetId,
                        funds: pool.funds,
                        available: (_c = availableDecimal === null || availableDecimal === void 0 ? void 0 : availableDecimal.toFixed(6)) !== null && _c !== void 0 ? _c : "0",
                        reward_id: (_e = (_d = pool.reward_coin_oracle_id) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : "",
                        reward_coin_type: pool.reward_coin_type,
                    };
                }
                return acc;
            }, {});
            // Map asset IDs to their symbols
            const assetSymbolMap = Object.values(address_1.pool).reduce((acc, poolConfig) => {
                acc[poolConfig.assetId.toString()] = poolConfig.name;
                return acc;
            }, {});
            const formattedData = Object.keys(processedData).reduce((acc, assetId) => {
                var _a;
                acc[assetId] = Object.assign(Object.assign({}, processedData[assetId]), { asset_symbol: (_a = assetSymbolMap[processedData[assetId].asset_id]) !== null && _a !== void 0 ? _a : null });
                return acc;
            }, {});
            // Pretty print the results if required
            if (prettyPrint) {
                console.log(`-- V2 available rewards --`);
                console.log(`address: ${checkAddress}`);
                Object.keys(formattedData).forEach((assetId) => {
                    const assetData = formattedData[assetId];
                    console.log(`Asset: ${assetData.asset_symbol}`);
                    console.log(`  ${Object.keys(formattedData).indexOf(assetId) + 1}. Reward Coin: ${assetData.reward_coin_type}, Option: ${option}, Claimable: ${assetData.available}`);
                });
            }
            return formattedData;
        }
        catch (error) {
            console.error("Failed to get available rewards:", error);
            throw error;
        }
    });
}
/**
 * Claims all available rewards for the specified account.
 * @returns PTB result
 */
function claimAllRewardsPTB(client, userToCheck, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        let txb = tx || new transactions_1.Transaction();
        const [rewardsBorrow, rewardsSupply] = yield Promise.all([
            getAvailableRewards(client, userToCheck, 3, false),
            getAvailableRewards(client, userToCheck, 1, false),
        ]);
        const borrowFunds = Object.values(rewardsBorrow).map((item) => item.funds);
        const supplyFunds = Object.values(rewardsSupply).map((item) => item.funds);
        const fundsIds = Array.from(new Set([...borrowFunds, ...supplyFunds]));
        let oracleIds = [];
        fundsIds.forEach((fundId) => {
            if (address_1.ProFundsPoolInfo[fundId]) {
                oracleIds.push(address_1.ProFundsPoolInfo[fundId].oracleId);
            }
        });
        oracleIds = Array.from(new Set([...oracleIds]));
        const coinPrice = yield (0, CallFunctions_1.getCoinOracleInfo)(client, oracleIds);
        const coinPriceMap = {};
        for (const item of coinPrice) {
            coinPriceMap[item.oracle_id] = {
                price: parseFloat(item.price) / Math.pow(10, item.decimals),
                decimals: item.decimals,
            };
        }
        // Convert the rewards object to an array of its values
        const rewardsArray = Object.values(rewardsSupply);
        for (const reward of rewardsArray) {
            const coinInfo = coinPriceMap[Number(reward.reward_id)];
            if (coinInfo) {
                const availableAmount = parseFloat(reward.available) * coinInfo.price;
                if (availableAmount >= 0.01) {
                    yield claimRewardFunction(txb, reward.funds, reward.asset_id, 1);
                }
            }
        }
        // Convert the rewards object to an array of its values
        const rewardsBorrowArray = Object.values(rewardsBorrow);
        for (const reward of rewardsBorrowArray) {
            const coinInfo = coinPriceMap[Number(reward.reward_id)];
            if (coinInfo) {
                const availableAmount = parseFloat(reward.available) * coinInfo.price;
                if (availableAmount >= 0.01) {
                    yield claimRewardFunction(txb, reward.funds, reward.asset_id, 3);
                }
            }
        }
        return txb;
    });
}
function claimRewardsByAssetIdPTB(client, userToCheck, assetId, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        let txb = tx || new transactions_1.Transaction();
        const [rewardsBorrow, rewardsSupply] = yield Promise.all([
            getAvailableRewards(client, userToCheck, 3, false),
            getAvailableRewards(client, userToCheck, 1, false),
        ]);
        // Convert the rewards object to an array of its values
        const rewardsArray = Object.values(rewardsSupply);
        for (const reward of rewardsArray) {
            if (reward.asset_id === assetId) {
                yield claimRewardFunction(txb, reward.funds, reward.asset_id, 1);
            }
        }
        // Convert the rewards object to an array of its values
        const rewardsBorrowArray = Object.values(rewardsBorrow);
        for (const reward of rewardsBorrowArray) {
            if (reward.asset_id === assetId) {
                yield claimRewardFunction(txb, reward.funds, reward.asset_id, 3);
            }
        }
        return txb;
    });
}
/**
 * Claims the reward for a transaction block.
 * @param txb - The transaction block.
 * @param incentiveFundsPool - The incentive funds pool.
 * @param assetId - The asset ID.
 * @param option - The option type.
 */
function claimRewardFunction(txb, incentiveFundsPool, assetId, option) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v2::claim_reward`,
            arguments: [
                txb.object("0x06"),
                txb.object(config.IncentiveV2),
                txb.object(`0x${incentiveFundsPool}`),
                txb.object(config.StorageId),
                txb.pure.u8(assetId),
                txb.pure.u8(option),
            ],
            typeArguments: [address_1.ProFundsPoolInfo[incentiveFundsPool].coinType],
        });
    });
}
/**
 * Claims all available rewards for the specified account.
 * @returns PTB result
 */
function claimAllRewardsResupplyPTB(client, userToCheck, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        let txb = tx || new transactions_1.Transaction();
        const [rewardsBorrow, rewardsSupply] = yield Promise.all([
            getAvailableRewards(client, userToCheck, 3, false),
            getAvailableRewards(client, userToCheck, 1, false),
        ]);
        const borrowFunds = Object.values(rewardsBorrow).map((item) => item.funds);
        const supplyFunds = Object.values(rewardsSupply).map((item) => item.funds);
        const fundsIds = Array.from(new Set([...borrowFunds, ...supplyFunds]));
        let oracleIds = [];
        fundsIds.forEach((fundId) => {
            if (address_1.ProFundsPoolInfo[fundId]) {
                oracleIds.push(address_1.ProFundsPoolInfo[fundId].oracleId);
            }
        });
        oracleIds = Array.from(new Set([...oracleIds]));
        const coinPrice = yield (0, CallFunctions_1.getCoinOracleInfo)(client, oracleIds);
        const coinPriceMap = {};
        for (const item of coinPrice) {
            coinPriceMap[item.oracle_id] = {
                price: parseFloat(item.price) / Math.pow(10, item.decimals),
                decimals: item.decimals,
            };
        }
        // Convert the rewards object to an array of its values
        const rewardsArray = Object.values(rewardsSupply);
        for (const reward of rewardsArray) {
            const coinInfo = coinPriceMap[Number(reward.reward_id)];
            if (coinInfo) {
                const availableAmount = parseFloat(reward.available) * coinInfo.price;
                if (availableAmount >= 0.01) {
                    yield claimRewardResupplyFunction(txb, reward.funds, reward.asset_id, 1);
                }
            }
        }
        // Convert the rewards object to an array of its values
        const rewardsBorrowArray = Object.values(rewardsBorrow);
        for (const reward of rewardsBorrowArray) {
            const coinInfo = coinPriceMap[Number(reward.reward_id)];
            if (coinInfo) {
                const availableAmount = parseFloat(reward.available) * coinInfo.price;
                if (availableAmount >= 0.01) {
                    yield claimRewardResupplyFunction(txb, reward.funds, reward.asset_id, 3);
                }
            }
        }
        return txb;
    });
}
/**
 * Claims the reward for a transaction block.
 * @param txb - The transaction block.
 * @param incentiveFundsPool - The incentive funds pool.
 * @param assetId - The asset ID.
 * @param option - The option type.
 */
function claimRewardResupplyFunction(txb, incentiveFundsPool, assetId, option) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const reward_balance = txb.moveCall({
            target: `${config.ProtocolPackage}::incentive_v2::claim_reward_non_entry`,
            arguments: [
                txb.object("0x06"),
                txb.object(config.IncentiveV2),
                txb.object(`0x${incentiveFundsPool}`),
                txb.object(config.StorageId),
                txb.pure.u8(Number(assetId)),
                txb.pure.u8(option),
            ],
            typeArguments: [address_1.ProFundsPoolInfo[incentiveFundsPool].coinType],
        });
        const [reward_coin] = txb.moveCall({
            target: "0x2::coin::from_balance",
            arguments: [reward_balance],
            typeArguments: [address_1.ProFundsPoolInfo[incentiveFundsPool].coinType],
        });
        const reward_coin_value = txb.moveCall({
            target: "0x2::coin::value",
            arguments: [reward_coin],
            typeArguments: [address_1.ProFundsPoolInfo[incentiveFundsPool].coinType],
        });
        const foundPoolConfig = Object.values(address_1.pool).find((poolConfig) => (0, utils_1.normalizeStructTag)(poolConfig.type) ===
            (0, utils_1.normalizeStructTag)(address_1.ProFundsPoolInfo[incentiveFundsPool].coinType));
        if (!foundPoolConfig) {
            throw new Error(`Pool configuration not found. incentiveFundsPool: ${incentiveFundsPool}, ProFundsPoolInfo: ${JSON.stringify(address_1.ProFundsPoolInfo === null || address_1.ProFundsPoolInfo === void 0 ? void 0 : address_1.ProFundsPoolInfo[incentiveFundsPool])}`);
        }
        yield (0, commonFunctions_2.depositCoin)(txb, foundPoolConfig, reward_coin, reward_coin_value);
    });
}
function getIncentivePoolsByPhase(client, option, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const tx = new transactions_1.Transaction();
        // await updateOraclePTB(client, tx);
        const result = yield (0, CallFunctions_1.moveInspect)(tx, client, user, `${config.uiGetter}::incentive_getter::get_incentive_pools_group_by_phase`, [
            tx.object("0x06"), // clock object id
            tx.object(config.IncentiveV2), // the incentive object v2
            tx.object(config.StorageId), // object id of storage
            tx.pure.u8(1),
            tx.pure.u8(option),
            tx.pure.address(user), // If you provide your address, the rewards that have been claimed by your address and the total rewards will be returned.
        ], [], // type arguments is null
        "vector<IncentivePoolInfoByPhase>" // parse type
        );
        return result[0];
    });
}

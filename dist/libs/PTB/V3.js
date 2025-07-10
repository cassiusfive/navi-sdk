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
exports.registerStructs = registerStructs;
exports.getAvailableRewards = getAvailableRewards;
exports.getAvailableRewardsWithoutOption = getAvailableRewardsWithoutOption;
exports.claimRewardFunction = claimRewardFunction;
exports.claimAllRewardsPTB = claimAllRewardsPTB;
exports.claimRewardsByAssetIdPTB = claimRewardsByAssetIdPTB;
exports.claimRewardResupplyFunction = claimRewardResupplyFunction;
exports.claimAllRewardsResupplyPTB = claimAllRewardsResupplyPTB;
exports.getBorrowFee = getBorrowFee;
exports.calculateApy = calculateApy;
exports.groupByAssetCoinType = groupByAssetCoinType;
exports.getCurrentRules = getCurrentRules;
exports.getPoolsApyOuter = getPoolsApyOuter;
exports.getPoolApy = getPoolApy;
exports.getPoolsApy = getPoolsApy;
const transactions_1 = require("@mysten/sui/transactions");
const utils_1 = require("@mysten/sui/utils");
const bcs_1 = require("@mysten/sui.js/bcs");
const CallFunctions_1 = require("../CallFunctions");
const commonFunctions_1 = require("./commonFunctions");
const PoolInfo_1 = require("../PoolInfo");
const address_1 = require("../../address");
const SECONDS_PER_DAY = 86400;
const RATE_MULTIPLIER = 1000;
/**
 * Ensure that a coin type string starts with "0x".
 * @param coinType - The original coin type.
 * @returns The formatted coin type.
 */
function formatCoinType(coinType) {
    return coinType.startsWith("0x") ? coinType : "0x" + coinType;
}
function registerStructs() {
    bcs_1.bcs.registerStructType("ClaimableReward", {
        asset_coin_type: "string",
        reward_coin_type: "string",
        user_claimable_reward: "u256",
        user_claimed_reward: "u256",
        rule_ids: "vector<address>",
    });
}
// Inline helper functions to retrieve configuration keys.
const getPriceFeedKey = (coinType) => {
    const formattedCoinType = coinType.startsWith("0x")
        ? coinType
        : `0x${coinType}`;
    return Object.keys(address_1.PriceFeedConfig).find((key) => address_1.PriceFeedConfig[key].coinType === formattedCoinType);
};
const getPoolKey = (coinType) => {
    const formattedCoinType = coinType.startsWith("0x")
        ? coinType
        : `0x${coinType}`;
    return Object.keys(address_1.pool).find((key) => (0, utils_1.normalizeStructTag)(address_1.pool[key].type) === formattedCoinType);
};
/**
 * Fetch and group available v3 rewards for a user.
 *
 * @param {SuiClient} client - The Sui client instance used to interact with the blockchain.
 * @param {string} userAddress - The blockchain address of the user whose rewards are being fetched.
 * @param {boolean} [prettyPrint=true] - Whether to log the rewards data in a readable format.
 * @returns {Promise<V3Type.GroupedRewards | null>} A promise resolving to the grouped rewards by asset type, or null if no rewards.
 * @throws {Error} If fetching rewards data fails or returns undefined.
 */
function getAvailableRewards(client_1, checkAddress_1) {
    return __awaiter(this, arguments, void 0, function* (client, checkAddress, prettyPrint = true) {
        var _a;
        // Fetch the protocol configuration
        const protocolConfig = yield (0, address_1.getConfig)();
        // Create a new transaction instance
        const tx = new transactions_1.Transaction();
        // Call the Move function to fetch the user's claimable rewards
        const rewardsData = yield (0, CallFunctions_1.moveInspect)(tx, client, checkAddress, `${protocolConfig.uiGetter}::incentive_v3_getter::get_user_atomic_claimable_rewards`, [
            tx.object("0x06"),
            tx.object(protocolConfig.StorageId),
            tx.object(protocolConfig.IncentiveV3),
            tx.pure.address(checkAddress),
        ]);
        if (!rewardsData) {
            throw new Error("Failed to fetch v3 rewards data: moveInspect returned undefined.");
        }
        // Parse the raw rewards data into an array of reward objects.
        // The data may be in the new tuple format (5 arrays) or the legacy object array format.
        let rewardsList = [];
        if (Array.isArray(rewardsData)) {
            // Check if the data is in the new tuple format (5 arrays and the first element is an array)
            if (rewardsData.length === 5 && Array.isArray(rewardsData[0])) {
                const count = rewardsData[0].length;
                for (let i = 0; i < count; i++) {
                    rewardsList.push({
                        asset_coin_type: rewardsData[0][i],
                        reward_coin_type: rewardsData[1][i],
                        option: Number(rewardsData[2][i]),
                        // Ensure rule_ids is always an array
                        rule_ids: Array.isArray(rewardsData[3][i])
                            ? rewardsData[3][i]
                            : [rewardsData[3][i]],
                        user_claimable_reward: Number(rewardsData[4][i]),
                    });
                }
            }
            else {
                // Assume the data is in the legacy format: an array of reward objects
                rewardsList = rewardsData;
            }
        }
        if (rewardsList.length === 0) {
            if (prettyPrint) {
                console.log("No v3 rewards");
            }
            return null;
        }
        // Group rewards by asset coin type.
        const groupedRewards = {};
        for (const reward of rewardsList) {
            const { asset_coin_type, reward_coin_type, option, rule_ids, user_claimable_reward, } = reward;
            // Retrieve configuration keys for asset and reward coin types.
            const assetPriceFeedKey = getPriceFeedKey(asset_coin_type);
            const rewardPriceFeedKey = getPriceFeedKey(reward_coin_type);
            const assetPoolKey = getPoolKey(asset_coin_type);
            const rewardPoolKey = getPoolKey(reward_coin_type);
            // Skip reward if any necessary configuration is missing.
            if (!assetPriceFeedKey ||
                !rewardPriceFeedKey ||
                !assetPoolKey ||
                !rewardPoolKey) {
                continue;
            }
            // Initialize rewards array for this asset if not already present.
            if (!groupedRewards[asset_coin_type]) {
                groupedRewards[asset_coin_type] = [];
            }
            // Convert the raw claimable reward into a human-readable value using the proper decimal precision.
            const decimalPrecision = address_1.PriceFeedConfig[rewardPriceFeedKey].priceDecimal;
            const convertedClaimable = Number(user_claimable_reward) / Math.pow(10, decimalPrecision);
            groupedRewards[asset_coin_type].push({
                asset_id: address_1.pool[assetPoolKey].assetId.toString(),
                reward_id: address_1.pool[rewardPoolKey].assetId.toString(),
                reward_coin_type,
                option,
                rule_ids,
                user_claimable_reward: convertedClaimable,
            });
        }
        // If prettyPrint is enabled, log the grouped rewards in a user-friendly format.
        if (prettyPrint) {
            console.log(`-- V3 Available Rewards --`);
            console.log(`address: ${checkAddress}`);
            for (const [assetCoinType, rewards] of Object.entries(groupedRewards)) {
                const assetKey = (_a = getPriceFeedKey(assetCoinType)) !== null && _a !== void 0 ? _a : assetCoinType;
                console.log(`Asset: ${assetKey}`);
                rewards.forEach((reward, idx) => {
                    var _a;
                    const rewardKey = (_a = getPriceFeedKey(reward.reward_coin_type)) !== null && _a !== void 0 ? _a : reward.reward_coin_type;
                    console.log(`  ${idx + 1}. Reward Coin: ${rewardKey}, Option: ${reward.option}, ` + `Claimable: ${reward.user_claimable_reward}`);
                });
            }
        }
        return groupedRewards;
    });
}
/**
 * Retrieves the available rewards for a specific user in the protocol.
 *
 * This function communicates with the Sui blockchain to fetch and process
 * claimable rewards for a user based on their interactions with the protocol.
 *
 * @param {SuiClient} client - The Sui client instance used to interact with the blockchain.
 * @param {string} userAddress - The blockchain address of the user whose rewards are being fetched.
 * @param {boolean} [prettyPrint=true] - Whether to log the rewards data in a readable format.
 * @returns {Promise<V3Type.GroupedRewards | null>} A promise resolving to the grouped rewards by asset type, or null if no rewards.
 * @throws {Error} If fetching rewards data fails or returns undefined.
 */
function getAvailableRewardsWithoutOption(client_1, userAddress_1) {
    return __awaiter(this, arguments, void 0, function* (client, userAddress, prettyPrint = true) {
        var _a;
        // Fetch the protocol configuration.
        const protocolConfig = yield (0, address_1.getConfig)();
        // Register necessary Move structs.
        registerStructs();
        // Create a transaction and invoke the Move function to get user claimable rewards.
        const tx = new transactions_1.Transaction();
        const claimableRewardsCall = tx.moveCall({
            target: `${protocolConfig.ProtocolPackage}::incentive_v3::get_user_claimable_rewards`,
            arguments: [
                tx.object("0x06"),
                tx.object(protocolConfig.StorageId),
                tx.object(protocolConfig.IncentiveV3),
                tx.pure.address(userAddress),
            ],
        });
        const rewardsData = yield (0, CallFunctions_1.moveInspect)(tx, client, userAddress, `${protocolConfig.ProtocolPackage}::incentive_v3::parse_claimable_rewards`, [claimableRewardsCall], [], "vector<ClaimableReward>");
        if (!rewardsData) {
            throw new Error("Failed to fetch v3 rewards data: moveInspect returned undefined.");
        }
        const rawRewards = rewardsData[0];
        if (rawRewards.length === 0) {
            if (prettyPrint) {
                console.log("No v3 rewards");
            }
            return null;
        }
        // Helper function: Retrieve the corresponding key from PriceFeedConfig based on coin type.
        const getPriceFeedKey = (coinType) => Object.keys(address_1.PriceFeedConfig).find((key) => address_1.PriceFeedConfig[key].coinType === `0x${coinType}`);
        // Helper function: Retrieve the corresponding key from pool based on coin type.
        const getPoolKey = (coinType) => Object.keys(address_1.pool).find((key) => (0, utils_1.normalizeStructTag)(address_1.pool[key].type) === `0x${coinType}`);
        // Group the rewards by asset coin type.
        const groupedRewards = rawRewards.reduce((acc, reward) => {
            const { asset_coin_type, reward_coin_type, user_claimable_reward, user_claimed_reward, rule_ids, } = reward;
            // Retrieve configuration keys for asset and reward coin types.
            const assetPriceFeedKey = getPriceFeedKey(asset_coin_type);
            const rewardPriceFeedKey = getPriceFeedKey(reward_coin_type);
            const assetPoolKey = getPoolKey(asset_coin_type);
            const rewardPoolKey = getPoolKey(reward_coin_type);
            // Skip this reward if any necessary configuration is missing.
            if (!assetPriceFeedKey ||
                !rewardPriceFeedKey ||
                !assetPoolKey ||
                !rewardPoolKey) {
                return acc;
            }
            // Initialize the grouping for the asset coin type if not present.
            if (!acc[asset_coin_type]) {
                acc[asset_coin_type] = [];
            }
            // Determine decimal precision based on the reward coin's configuration.
            const decimalPrecision = address_1.PriceFeedConfig[rewardPriceFeedKey].priceDecimal;
            // Convert raw reward amounts to human-readable values.
            const convertedClaimable = Number(user_claimable_reward) / Math.pow(10, decimalPrecision);
            const convertedClaimed = Number(user_claimed_reward) / Math.pow(10, decimalPrecision);
            // Append the reward details to the grouped rewards.
            acc[asset_coin_type].push({
                asset_id: address_1.pool[assetPoolKey].assetId.toString(),
                reward_id: address_1.pool[rewardPoolKey].assetId.toString(),
                reward_coin_type,
                user_claimable_reward: convertedClaimable,
                user_claimed_reward: convertedClaimed,
                rule_ids,
            });
            return acc;
        }, {});
        // If prettyPrint is enabled, log the rewards data in a human-readable format.
        if (prettyPrint) {
            console.log(`-- V3 Available Rewards --`);
            for (const [assetCoinType, rewards] of Object.entries(groupedRewards)) {
                // Map the asset coin type to a human-readable identifier.
                const assetKey = (_a = getPriceFeedKey(assetCoinType)) !== null && _a !== void 0 ? _a : assetCoinType;
                console.log(`Asset: ${assetKey}`);
                rewards.forEach((reward, idx) => {
                    var _a;
                    const rewardKey = (_a = getPriceFeedKey(reward.reward_coin_type)) !== null && _a !== void 0 ? _a : reward.reward_coin_type;
                    console.log(`  ${idx + 1}. Reward Coin: ${rewardKey}, ` +
                        `Claimable: ${reward.user_claimable_reward}, Claimed: ${reward.user_claimed_reward}`);
                });
            }
        }
        return groupedRewards;
    });
}
/**
 * Claim a specific reward by calling the Move entry function.
 * @param tx The Transaction object.
 * @param rewardInfo The minimal reward info, including asset_coin_type, reward_coin_type, rule_ids
 */
function claimRewardFunction(tx, rewardInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        // console.log("Claiming reward:", rewardInfo);
        // Find matching rewardFund from the pool config
        let matchedRewardFund = null;
        for (const key of Object.keys(address_1.pool)) {
            // e.g. "0x2::sui::SUI".slice(2) => "2::sui::SUI"
            const normalizedType = (0, utils_1.normalizeStructTag)(address_1.pool[key].type);
            const coinTypeWithoutHex = normalizedType.startsWith("0x")
                ? normalizedType.slice(2)
                : normalizedType;
            const rewardCoinTypeWithoutHex = rewardInfo.reward_coin_type.startsWith("0x")
                ? rewardInfo.reward_coin_type.slice(2)
                : rewardInfo.reward_coin_type;
            if (coinTypeWithoutHex === rewardCoinTypeWithoutHex) {
                matchedRewardFund = address_1.pool[key].rewardFundId;
                break;
            }
        }
        if (!matchedRewardFund) {
            console.log(`No matching rewardFund found for reward_coin_type: ${rewardInfo.reward_coin_type}`);
            return;
        }
        else {
            tx.moveCall({
                target: `${config.ProtocolPackage}::incentive_v3::claim_reward_entry`,
                arguments: [
                    tx.object("0x06"),
                    tx.object(config.IncentiveV3),
                    tx.object(config.StorageId),
                    tx.object(matchedRewardFund),
                    tx.pure.vector("string", rewardInfo.asset_vector),
                    tx.pure.vector("address", rewardInfo.rules_vector),
                ],
                typeArguments: [rewardInfo.reward_coin_type],
            });
        }
    });
}
/**
 * Claim all rewards for a user by iterating through the grouped rewards.
 * @param client SuiClient instance
 * @param userAddress The address of the user to claim for
 * @param existingTx (Optional) If provided, we append to this Transaction instead of creating a new one
 * @returns The Transaction with all claim commands appended
 */
function claimAllRewardsPTB(client, userAddress, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize the transaction object, use existingTx if provided
        const tx = existingTx !== null && existingTx !== void 0 ? existingTx : new transactions_1.Transaction();
        // Fetch the available grouped rewards for the user
        const groupedRewards = yield getAvailableRewardsWithoutOption(client, userAddress, false);
        if (!groupedRewards) {
            return tx;
        }
        // Object to store aggregated rewards by coin type
        const rewardMap = new Map();
        // Single-pass aggregation using Map for O(1) lookups
        for (const [poolId, rewards] of Object.entries(groupedRewards)) {
            for (const reward of rewards) {
                const { reward_coin_type: coinType, rule_ids: ruleIds } = reward;
                for (const ruleId of ruleIds) {
                    if (!rewardMap.has(coinType)) {
                        rewardMap.set(coinType, { assetIds: [], ruleIds: [] });
                    }
                    const group = rewardMap.get(coinType);
                    group.assetIds.push(poolId);
                    group.ruleIds.push(ruleId);
                }
            }
        }
        // Asynchronously create claim transaction instructions for each reward coin type
        Array.from(rewardMap).map((_a) => __awaiter(this, [_a], void 0, function* ([coinType, { assetIds, ruleIds }]) {
            const claimInput = {
                reward_coin_type: coinType,
                asset_vector: assetIds,
                rules_vector: ruleIds,
            };
            yield claimRewardFunction(tx, claimInput);
        }));
        return tx;
    });
}
function filterRewardsByAssetId(groupedRewards, assetId) {
    const result = {};
    for (const assetCoinType in groupedRewards) {
        if (groupedRewards.hasOwnProperty(assetCoinType)) {
            const processedRewardsList = groupedRewards[assetCoinType];
            const filteredRewards = processedRewardsList.filter((reward) => reward.asset_id === assetId);
            if (filteredRewards.length > 0) {
                result[assetCoinType] = filteredRewards;
            }
        }
    }
    return result;
}
function claimRewardsByAssetIdPTB(client, userAddress, assetId, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize the transaction object, use existingTx if provided
        const tx = existingTx !== null && existingTx !== void 0 ? existingTx : new transactions_1.Transaction();
        // Fetch the available grouped rewards for the user
        const groupedRewards = yield getAvailableRewardsWithoutOption(client, userAddress, false);
        if (!groupedRewards) {
            return tx;
        }
        const filterGroupedRewards = filterRewardsByAssetId(groupedRewards, assetId.toString());
        // Object to store aggregated rewards by coin type
        const rewardMap = new Map();
        // Single-pass aggregation using Map for O(1) lookups
        for (const [poolId, rewards] of Object.entries(filterGroupedRewards)) {
            for (const reward of rewards) {
                const { reward_coin_type: coinType, rule_ids: ruleIds } = reward;
                for (const ruleId of ruleIds) {
                    if (!rewardMap.has(coinType)) {
                        rewardMap.set(coinType, { assetIds: [], ruleIds: [] });
                    }
                    const group = rewardMap.get(coinType);
                    group.assetIds.push(poolId);
                    group.ruleIds.push(ruleId);
                }
            }
        }
        // Asynchronously create claim transaction instructions for each reward coin type
        Array.from(rewardMap).map((_a) => __awaiter(this, [_a], void 0, function* ([coinType, { assetIds, ruleIds }]) {
            const claimInput = {
                reward_coin_type: coinType,
                asset_vector: assetIds,
                rules_vector: ruleIds,
            };
            yield claimRewardFunction(tx, claimInput);
        }));
        return tx;
    });
}
/**
 * Claim a specific reward by calling the Move entry function.
 * @param tx The Transaction object.
 * @param rewardInfo The minimal reward info, including asset_coin_type, reward_coin_type, rule_ids
 */
function claimRewardResupplyFunction(tx, rewardInfo, userAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        // Find matching rewardFund from the pool config
        let matchedRewardFund = null;
        let toPoolConfig = null;
        for (const key of Object.keys(address_1.pool)) {
            // e.g. "0x2::sui::SUI".slice(2) => "2::sui::SUI"
            const normalizedType = (0, utils_1.normalizeStructTag)(address_1.pool[key].type);
            const coinTypeWithoutHex = normalizedType.startsWith("0x")
                ? normalizedType.slice(2)
                : normalizedType;
            const rewardCoinTypeWithoutHex = rewardInfo.reward_coin_type.startsWith("0x")
                ? rewardInfo.reward_coin_type.slice(2)
                : rewardInfo.reward_coin_type;
            if (coinTypeWithoutHex === rewardCoinTypeWithoutHex) {
                matchedRewardFund = address_1.pool[key].rewardFundId;
                toPoolConfig = address_1.pool[key];
                break;
            }
        }
        if (!matchedRewardFund || !toPoolConfig) {
            throw new Error(`No matching rewardFund found for reward_coin_type: ${rewardInfo.reward_coin_type}`);
        }
        // Construct the Move call
        const reward_balance = tx.moveCall({
            target: `${config.ProtocolPackage}::incentive_v3::claim_reward`,
            arguments: [
                tx.object("0x06"),
                tx.object(config.IncentiveV3),
                tx.object(config.StorageId),
                tx.object(matchedRewardFund),
                tx.pure.vector("string", rewardInfo.asset_vector),
                tx.pure.vector("address", rewardInfo.rules_vector),
            ],
            typeArguments: [toPoolConfig.type],
        });
        const [reward_coin] = tx.moveCall({
            target: "0x2::coin::from_balance",
            arguments: [reward_balance],
            typeArguments: [toPoolConfig.type],
        });
        if (address_1.noDepositCoinType.includes(rewardInfo.reward_coin_type)) {
            tx.transferObjects([reward_coin], userAddress);
        }
        else {
            const reward_coin_value = tx.moveCall({
                target: "0x2::coin::value",
                arguments: [reward_coin],
                typeArguments: [toPoolConfig.type],
            });
            yield (0, commonFunctions_1.depositCoin)(tx, toPoolConfig, reward_coin, reward_coin_value);
        }
    });
}
/**
 * Claim all rewards for a user by iterating through the grouped rewards.
 * @param client SuiClient instance
 * @param userAddress The address of the user to claim for
 * @param existingTx (Optional) If provided, we append to this Transaction instead of creating a new one
 * @returns The Transaction with all claim commands appended
 */
function claimAllRewardsResupplyPTB(client, userAddress, existingTx) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize the transaction object, use existingTx if provided
        const tx = existingTx !== null && existingTx !== void 0 ? existingTx : new transactions_1.Transaction();
        // Fetch the available grouped rewards for the user
        const groupedRewards = yield getAvailableRewardsWithoutOption(client, userAddress, false);
        if (!groupedRewards) {
            return tx;
        }
        // Object to store aggregated rewards by coin type
        const rewardMap = new Map();
        // Single-pass aggregation using Map for O(1) lookups
        for (const [poolId, rewards] of Object.entries(groupedRewards)) {
            for (const reward of rewards) {
                const { reward_coin_type: coinType, rule_ids: ruleIds } = reward;
                for (const ruleId of ruleIds) {
                    if (!rewardMap.has(coinType)) {
                        rewardMap.set(coinType, { assetIds: [], ruleIds: [] });
                    }
                    const group = rewardMap.get(coinType);
                    group.assetIds.push(poolId);
                    group.ruleIds.push(ruleId);
                }
            }
        }
        // Asynchronously create claim transaction instructions for each reward coin type
        Array.from(rewardMap).map((_a) => __awaiter(this, [_a], void 0, function* ([coinType, { assetIds, ruleIds }]) {
            const claimInput = {
                reward_coin_type: coinType,
                asset_vector: assetIds,
                rules_vector: ruleIds,
            };
            yield claimRewardResupplyFunction(tx, claimInput, userAddress);
        }));
        return tx;
    });
}
function getBorrowFee(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const protocolConfig = yield (0, address_1.getConfig)();
        const rawData = yield client.getObject({
            id: protocolConfig.IncentiveV3,
            options: { showType: true, showOwner: true, showContent: true },
        });
        const borrowFee = rawData.data.content.fields.borrow_fee_rate;
        return Number(borrowFee) / 100;
    });
}
/**
 * Calculate the sum of reward rates and collect reward coin types.
 *
 * @param rules - Array of enabled rules.
 * @param coinPriceMap - Mapping from coin types to their prices.
 * @returns An object containing the total rate sum and a list of reward coin types.
 */
function calculateRateSumAndCoins(rules, coinPriceMap) {
    return rules.reduce((acc, rule) => {
        var _a, _b, _c;
        const ruleRate = Number(rule.rate) / 1e27; // Convert from large integer representation
        const formattedRewardCoinType = formatCoinType(rule.rewardCoinType);
        const rewardPrice = ((_a = coinPriceMap[formattedRewardCoinType]) === null || _a === void 0 ? void 0 : _a.value) || 0;
        const rewardDecimal = Number((_b = coinPriceMap[formattedRewardCoinType]) === null || _b === void 0 ? void 0 : _b.decimals) || 9;
        if (rewardPrice === 0) {
            console.log(`No price data found for reward coin type: ${rule.rewardCoinType} (${formattedRewardCoinType})`);
        }
        if (!((_c = coinPriceMap[formattedRewardCoinType]) === null || _c === void 0 ? void 0 : _c.decimals)) {
            console.log(`No decimal data found for reward coin type: ${rule.rewardCoinType} (${formattedRewardCoinType})`);
        }
        acc.rateSum += (ruleRate * rewardPrice) / Math.pow(10, rewardDecimal);
        acc.rewardCoins.push(rule.rewardCoinType);
        return acc;
    }, { rateSum: 0, rewardCoins: [] });
}
/**
 * Compute the final APY based on the aggregated rate and the pool's asset value.
 *
 * Formula: (rateSum * RATE_MULTIPLIER * SECONDS_PER_DAY * 365 * 100) / totalValue
 *
 * @param rateSum - Aggregated rate sum after conversion.
 * @param totalValue - Typically totalSupplyAmount * assetPrice.
 * @returns The APY value, or 0 if totalValue <= 0.
 */
function apyFormula(rateSum, totalValue) {
    if (totalValue <= 0)
        return 0;
    return (rateSum * RATE_MULTIPLIER * SECONDS_PER_DAY * 365 * 100) / totalValue;
}
/**
 * Calculate APY information (supply and borrow) for a list of grouped asset pools.
 *
 * @param groupedPools - Grouped pool data after calling `groupByAssetCoinType`.
 * @param poolsInfo - Full pool information (usually fetched from backend or a mock).
 * @returns An array of APY result objects for each pool.
 */
function calculateApy(groupedPools, reserves, coinPriceMap) {
    return __awaiter(this, void 0, void 0, function* () {
        return groupedPools.map((group) => {
            var _a;
            // Find the matching reserve data based on formatted coin type
            const matchingReserve = reserves.find((r) => formatCoinType(r.coin_type) === formatCoinType(group.assetCoinType));
            // Return default result if no matching reserve data or rules exist
            if (!matchingReserve || !((_a = group.rules) === null || _a === void 0 ? void 0 : _a.length)) {
                return {
                    asset: group.asset,
                    assetCoinType: group.assetCoinType,
                    supplyIncentiveApyInfo: { rewardCoin: [], apy: 0 },
                    borrowIncentiveApyInfo: { rewardCoin: [], apy: 0 },
                };
            }
            // Get asset price from the price map
            const assetPrice = coinPriceMap[group.assetCoinType] || 0;
            const totalSupplyAmount = Number(matchingReserve.total_supply || 0);
            const borrowedAmount = Number(matchingReserve.total_borrow || 0);
            // Filter enabled rules (enabled and non-zero rate)
            const enabledRules = group.rules.filter((rule) => rule.enable && rule.rate !== "0");
            // Calculate Supply APY (option === 1)
            const supplyRules = enabledRules.filter((r) => r.option === 1);
            const { rateSum: supplyRateSum, rewardCoins: supplyRewardCoins } = calculateRateSumAndCoins(supplyRules, coinPriceMap);
            const supplyApy = apyFormula(supplyRateSum, (totalSupplyAmount / Math.pow(10, Number(9)) * assetPrice.value));
            // Calculate Borrow APY (option === 3)
            const borrowRules = enabledRules.filter((r) => r.option === 3);
            const { rateSum: borrowRateSum, rewardCoins: borrowRewardCoins } = calculateRateSumAndCoins(borrowRules, coinPriceMap);
            const borrowApy = apyFormula(borrowRateSum, (borrowedAmount / Math.pow(10, Number(9)) * assetPrice.value));
            return {
                asset: group.asset,
                assetCoinType: group.assetCoinType,
                supplyIncentiveApyInfo: {
                    rewardCoin: supplyRewardCoins,
                    apy: supplyApy,
                },
                borrowIncentiveApyInfo: {
                    rewardCoin: borrowRewardCoins,
                    apy: borrowApy,
                },
            };
        });
    });
}
/**
 * Group the raw incentive data by asset_coin_type.
 *
 * @param incentiveData - Data structure returned by the Sui client.
 * @returns A list of grouped asset pools, each containing an array of rules.
 */
function groupByAssetCoinType(incentiveData) {
    const groupedMap = new Map();
    const rawPools = incentiveData.data.content.fields.pools.fields.contents;
    rawPools.forEach((poolEntry) => {
        var _a;
        const assetPool = poolEntry.fields.value.fields;
        const formattedCoinType = formatCoinType(assetPool.asset_coin_type);
        const assetPoolKey = getPoolKey(formattedCoinType);
        const { asset } = assetPool;
        const rulesList = assetPool.rules.fields.contents;
        if (!groupedMap.has(formattedCoinType)) {
            groupedMap.set(formattedCoinType, {
                asset,
                assetSymbol: ((_a = address_1.pool[assetPoolKey !== null && assetPoolKey !== void 0 ? assetPoolKey : ""]) === null || _a === void 0 ? void 0 : _a.name) || "",
                assetCoinType: formattedCoinType,
                rules: [],
            });
        }
        const groupedPool = groupedMap.get(formattedCoinType);
        rulesList.forEach((ruleEntry) => {
            var _a, _b;
            const rule = ruleEntry.fields.value.fields;
            const formattedRewardCoinType = formatCoinType(rule.reward_coin_type);
            const rewardPoolKey = getPoolKey(formattedRewardCoinType);
            const rewardPriceFeedKey = getPriceFeedKey(formattedRewardCoinType);
            groupedPool.rules.push({
                ruleId: rule.id.id,
                option: rule.option,
                optionType: rule.option === 1 ? "supply" : rule.option === 3 ? "borrow" : "",
                rewardCoinType: rule.reward_coin_type,
                rewardSymbol: (rewardPoolKey && ((_a = address_1.pool[rewardPoolKey]) === null || _a === void 0 ? void 0 : _a.name)) || "",
                rewardDecimal: (rewardPriceFeedKey &&
                    ((_b = address_1.PriceFeedConfig[rewardPriceFeedKey]) === null || _b === void 0 ? void 0 : _b.priceDecimal)) ||
                    -1,
                rate: rule.rate,
                enable: rule.enable,
            });
        });
    });
    return Array.from(groupedMap.values());
}
// Merges two arrays of reward coins and ensures uniqueness
const mergeRewardCoins = (coins1, coins2) => {
    const addPrefix = (coin) => coin.startsWith("0x") ? coin : `0x${coin}`;
    return Array.from(new Set([...coins1.map(addPrefix), ...coins2.map(addPrefix)]));
};
// Function to merge APY results from V2 and V3
function mergeApyResults(v3ApyResults, // V3 APY results
v2SupplyApy, // V2 supply APY data
v2BorrowApy // V2 borrow APY data
) {
    return __awaiter(this, void 0, void 0, function* () {
        // Helper function to calculate APY as a percentage
        const calculateApyPercentage = (apyStr) => (Number(apyStr) / 1e27) * 100;
        // Helper function to get the asset's coin type, keep the "0x" prefix if present
        const getFormattedCoinType = (assetId) => {
            const poolValues = Object.values(address_1.pool);
            const poolEntry = poolValues.find((entry) => entry.assetId === assetId);
            if (!poolEntry)
                return "";
            return (0, utils_1.normalizeStructTag)(poolEntry.type);
        };
        // Map to store merged V2 supply and borrow data by asset ID
        const v2DataMap = new Map();
        // Merge V2 supply data into v2DataMap
        v2SupplyApy.forEach((supplyData) => {
            const computedApy = calculateApyPercentage(supplyData.apy);
            const existingData = v2DataMap.get(supplyData.asset_id) || {
                supply: { apy: 0, rewardCoin: [] },
                borrow: { apy: 0, rewardCoin: [] },
            };
            existingData.supply.apy += computedApy;
            existingData.supply.rewardCoin = mergeRewardCoins(existingData.supply.rewardCoin, supplyData.coin_types);
            v2DataMap.set(supplyData.asset_id, existingData);
        });
        // Merge V2 borrow data into v2DataMap
        v2BorrowApy.forEach((borrowData) => {
            const computedApy = calculateApyPercentage(borrowData.apy);
            const existingData = v2DataMap.get(borrowData.asset_id) || {
                supply: { apy: 0, rewardCoin: [] },
                borrow: { apy: 0, rewardCoin: [] },
            };
            existingData.borrow.apy += computedApy;
            existingData.borrow.rewardCoin = mergeRewardCoins(existingData.borrow.rewardCoin, borrowData.coin_types);
            v2DataMap.set(borrowData.asset_id, existingData);
        });
        // Map to store the final merged APY results by asset ID
        const finalApyResultsMap = new Map();
        // First, add V3 data to the final map (by asset ID)
        v3ApyResults.forEach((v3Data) => {
            // Helper function to ensure '0x' prefix
            const addPrefixToCoins = (coins) => coins.map((coin) => (coin.startsWith("0x") ? coin : `0x${coin}`));
            finalApyResultsMap.set(v3Data.asset, Object.assign(Object.assign({}, v3Data), { supplyIncentiveApyInfo: Object.assign(Object.assign({}, v3Data.supplyIncentiveApyInfo), { apy: Number(v3Data.supplyIncentiveApyInfo.apy.toFixed(4)), rewardCoin: addPrefixToCoins(v3Data.supplyIncentiveApyInfo.rewardCoin) }), borrowIncentiveApyInfo: Object.assign(Object.assign({}, v3Data.borrowIncentiveApyInfo), { apy: Number(v3Data.borrowIncentiveApyInfo.apy.toFixed(4)), rewardCoin: addPrefixToCoins(v3Data.borrowIncentiveApyInfo.rewardCoin) }), assetCoinType: getFormattedCoinType(v3Data.asset) }));
        });
        // Then, merge the V2 data into the final map
        v2DataMap.forEach((v2Data, assetId) => {
            if (finalApyResultsMap.has(assetId)) {
                const existingApyData = finalApyResultsMap.get(assetId);
                existingApyData.supplyIncentiveApyInfo.apy = Number((existingApyData.supplyIncentiveApyInfo.apy + v2Data.supply.apy).toFixed(4));
                existingApyData.supplyIncentiveApyInfo.rewardCoin = mergeRewardCoins(existingApyData.supplyIncentiveApyInfo.rewardCoin, v2Data.supply.rewardCoin);
                existingApyData.borrowIncentiveApyInfo.apy = Number((existingApyData.borrowIncentiveApyInfo.apy + v2Data.borrow.apy).toFixed(4));
                existingApyData.borrowIncentiveApyInfo.rewardCoin = mergeRewardCoins(existingApyData.borrowIncentiveApyInfo.rewardCoin, v2Data.borrow.rewardCoin);
            }
            else {
                finalApyResultsMap.set(assetId, {
                    asset: assetId,
                    // Ensure coin type is formatted correctly, regardless of whether it's a new asset or not
                    assetCoinType: getFormattedCoinType(assetId),
                    supplyIncentiveApyInfo: Object.assign(Object.assign({}, v2Data.supply), { apy: Number(v2Data.supply.apy.toFixed(4)) }),
                    borrowIncentiveApyInfo: Object.assign(Object.assign({}, v2Data.borrow), { apy: Number(v2Data.borrow.apy.toFixed(4)) }),
                });
            }
        });
        // Return the final merged list of APY results
        return Array.from(finalApyResultsMap.values());
    });
}
function getCurrentRules(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (0, address_1.getConfig)();
        const rawData = yield client.getObject({
            id: config.IncentiveV3,
            options: { showType: true, showOwner: true, showContent: true },
        });
        const incentiveData = rawData;
        const groupedPools = groupByAssetCoinType(incentiveData);
        const modifiedGroupedPools = groupedPools.map((pool) => ({
            asset: pool.asset,
            assetSymbol: pool.assetSymbol,
            assetCoinType: pool.assetCoinType,
            rules: pool.rules.map((rule) => ({
                ruleId: rule.ruleId,
                option: rule.option,
                optionType: rule.optionType,
                rewardSymbol: rule.rewardSymbol,
                rewardCoinType: `0x${rule.rewardCoinType}`,
                rate: rule.rate,
                ratePerWeek: rule.rewardDecimal === -1
                    ? null
                    : ((Number(rule.rate) / 1e27) *
                        RATE_MULTIPLIER *
                        SECONDS_PER_DAY *
                        7) /
                        Math.pow(10, Number(rule.rewardDecimal)),
                enable: rule.enable,
            })),
        }));
        return modifiedGroupedPools;
    });
}
/**
 * Main function to fetch on-chain data and compute APY information for inter used.
 *
 * @param client - SuiClient instance used to fetch the raw data.
 * @returns An array of final APY results for each pool.
 */
function getPoolApyInter(client) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Get configuration
        const config = yield (0, address_1.getConfig)();
        const userAddress = "0xcda879cde94eeeae2dd6df58c9ededc60bcf2f7aedb79777e47d95b2cfb016c2";
        // 2. Fetch ReserveData, IncentiveV3 data, and APY calculations in parallel
        const [reserves, rawData, v2SupplyApy, v2BorrowApy] = yield Promise.all([
            (0, CallFunctions_1.getReserveData)(config.StorageId, client),
            client.getObject({
                id: config.IncentiveV3,
                options: { showType: true, showOwner: true, showContent: true },
            }),
            (0, CallFunctions_1.getIncentiveAPY)(userAddress, client, 1),
            (0, CallFunctions_1.getIncentiveAPY)(userAddress, client, 3),
        ]);
        // 3. Process incentive data
        const incentiveData = rawData;
        const groupedPools = groupByAssetCoinType(incentiveData);
        // 4. Build a set of all coin types needed for price lookup
        const coinTypeSet = new Set();
        reserves.forEach((r) => {
            coinTypeSet.add(formatCoinType(r.coin_type));
        });
        groupedPools.forEach((group) => {
            coinTypeSet.add(group.assetCoinType);
            group.rules.forEach((rule) => {
                coinTypeSet.add(formatCoinType(rule.rewardCoinType));
            });
        });
        const coinTypes = Array.from(coinTypeSet);
        // 5. Fetch coin price data
        const coinPrices = yield (0, PoolInfo_1.fetchCoinPrices)(coinTypes, true);
        const coinPriceMap = (coinPrices === null || coinPrices === void 0 ? void 0 : coinPrices.reduce((map, price) => {
            map[formatCoinType(price.coinType)] = {
                value: price.value,
                decimals: price.decimals,
            };
            return map;
        }, {})) || {};
        // 6. Calculate APY using grouped incentive data and reserve data with price info
        const v3Apy = yield calculateApy(groupedPools, reserves, coinPriceMap);
        // 7. Merge the APY results
        return mergeApyResults(v3Apy, v2SupplyApy, v2BorrowApy);
    });
}
/**
 * Main function to fetch on-chain data and compute APY information for third party.
 *
 * @param client - SuiClient instance used to fetch the raw data.
 * @returns An array of final APY results for each pool.
 */
function getPoolsApyOuter(client, Token) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Get configuration
        const config = yield (0, address_1.getConfig)();
        const userAddress = "0xcda879cde94eeeae2dd6df58c9ededc60bcf2f7aedb79777e47d95b2cfb016c2";
        // 2. Fetch ReserveData, IncentiveV3 data, and APY calculations in parallel
        const [reserves, rawData, v2SupplyApy, v2BorrowApy] = yield Promise.all([
            (0, CallFunctions_1.getReserveData)(config.StorageId, client),
            client.getObject({
                id: config.IncentiveV3,
                options: { showType: true, showOwner: true, showContent: true },
            }),
            (0, CallFunctions_1.getIncentiveAPY)(userAddress, client, 1),
            (0, CallFunctions_1.getIncentiveAPY)(userAddress, client, 3),
        ]);
        // 3. Process incentive data
        const incentiveData = rawData;
        const groupedPools = groupByAssetCoinType(incentiveData);
        // 4. Build a set of all coin types needed for price lookup
        const coinTypeSet = new Set();
        reserves.forEach((r) => {
            coinTypeSet.add(formatCoinType(r.coin_type));
        });
        groupedPools.forEach((group) => {
            coinTypeSet.add(group.assetCoinType);
            group.rules.forEach((rule) => {
                coinTypeSet.add(formatCoinType(rule.rewardCoinType));
            });
        });
        const coinTypes = Array.from(coinTypeSet);
        // 5. Fetch coin price data
        const coinPrices = yield (0, PoolInfo_1.fetchCoinPrices)(coinTypes, false, Token);
        const coinPriceMap = (coinPrices === null || coinPrices === void 0 ? void 0 : coinPrices.reduce((map, price) => {
            map[formatCoinType(price.coinType)] = {
                value: price.value,
                decimals: price.decimals,
            };
            return map;
        }, {})) || {};
        // 6. Calculate APY using grouped incentive data and reserve data with price info
        const v3Apy = yield calculateApy(groupedPools, reserves, coinPriceMap);
        // 7. Merge the APY results
        return mergeApyResults(v3Apy, v2SupplyApy, v2BorrowApy);
    });
}
function addPrefixIfNeeded(address) {
    if (!address.startsWith("0x")) {
        return "0x" + address;
    }
    return address;
}
const transformPoolData = (data) => {
    return data.map(pool => {
        var _a, _b;
        return ({
            asset: pool.id,
            assetCoinType: addPrefixIfNeeded(pool.coinType),
            supplyIncentiveApyInfo: {
                rewardCoin: ((_a = pool.supplyIncentiveApyInfo) === null || _a === void 0 ? void 0 : _a.rewardCoin) || [],
                apy: parseFloat(pool.supplyIncentiveApyInfo.boostedApr),
            },
            borrowIncentiveApyInfo: {
                rewardCoin: ((_b = pool.borrowIncentiveApyInfo) === null || _b === void 0 ? void 0 : _b.rewardCoin) || [],
                apy: parseFloat(pool.borrowIncentiveApyInfo.boostedApr),
            },
        });
    });
};
function getPoolApy(client) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, PoolInfo_1.getPoolsInfo)()
            .then(data => {
            if (data) {
                return transformPoolData(data);
            }
            else {
                return getPoolApyInter(client);
            }
        })
            .catch(error => {
            console.error(error);
            throw error;
        });
    });
}
function getPoolsApy(client, Token) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, PoolInfo_1.getPoolsInfo)()
            .then(data => {
            if (data) {
                return transformPoolData(data);
            }
            else {
                return getPoolsApyOuter(client, Token);
            }
        })
            .catch(error => {
            console.error(error);
            throw error;
        });
    });
}

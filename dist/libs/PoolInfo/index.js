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
exports.fetchFlashloanData = exports.fetchPoolData = void 0;
exports.getPoolInfo = getPoolInfo;
exports.getLatestProtocolPackageId = getLatestProtocolPackageId;
exports.getUserRewardHistory = getUserRewardHistory;
exports.getPoolsInfo = getPoolsInfo;
exports.fetchCoinPrices = fetchCoinPrices;
exports.getAllPools = getAllPools;
const axios_1 = __importDefault(require("axios"));
const address_1 = require("../../address");
const client_1 = require("@mysten/sui/client");
const utils_1 = require("@mysten/sui/utils");
const fetchPoolData = (_a) => __awaiter(void 0, [_a], void 0, function* ({ poolId, client, reserveParentId, poolInfo, }) {
    var _b, _c, _d, _e, _f, _g;
    const poolData = poolInfo[poolId];
    const result = yield client.getDynamicFieldObject({
        parentId: reserveParentId,
        name: { type: "u8", value: poolId },
    });
    const filedsData = (_e = (_d = (_c = (_b = result.data) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.fields;
    const total_supply_with_index = (poolData.total_supply * filedsData.current_supply_index) / 1e27;
    const total_borrow_with_index = (poolData.total_borrow * filedsData.current_borrow_index) / 1e27;
    return {
        coin_type: poolData.coin_type,
        total_supply: total_supply_with_index,
        total_borrow: total_borrow_with_index,
        tokenPrice: poolData.price,
        base_supply_rate: poolData.supply_rate,
        base_borrow_rate: poolData.borrow_rate,
        boosted_supply_rate: poolData.boosted,
        boosted_borrow_rate: poolData.borrow_reward_apy,
        supply_cap_ceiling: Number(filedsData.supply_cap_ceiling / 1e36),
        borrow_cap_ceiling: Number((filedsData.borrow_cap_ceiling / 1e27).toFixed(2)) *
            poolData.total_supply,
        current_supply_utilization: total_supply_with_index /
            Number(filedsData.supply_cap_ceiling / 1e36),
        current_borrow_utilization: total_borrow_with_index /
            (Number((filedsData.borrow_cap_ceiling / 1e27).toFixed(2)) *
                poolData.total_supply),
        optimal_borrow_utilization: (Number((_g = (_f = filedsData.borrow_rate_factors) === null || _f === void 0 ? void 0 : _f.fields) === null || _g === void 0 ? void 0 : _g.optimal_utilization) / 1e27).toFixed(2),
        pool: poolData.pool,
        max_ltv: (Number(filedsData.ltv) / 1e27).toFixed(2),
        liquidation_threshold: (Number(filedsData.liquidation_factors.fields.threshold) / 1e27).toFixed(2),
        symbol: poolData.symbol,
        rewardTokenAddress: poolData.rewardTokens,
    };
});
exports.fetchPoolData = fetchPoolData;
const fetchFlashloanData = (client) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, address_1.getConfig)();
    const result = yield client.getDynamicFields({
        parentId: config.flashloanSupportedAssets,
    });
    const resultList = {};
    yield Promise.all(result.data.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const result2 = yield client.getObject({
            id: item.objectId,
            options: {
                showContent: true,
            },
        });
        const fields = (_d = (_c = (_b = (_a = result2.data) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.fields) === null || _c === void 0 ? void 0 : _c.value) === null || _d === void 0 ? void 0 : _d.fields;
        const coin_type = fields === null || fields === void 0 ? void 0 : fields.coin_type;
        if (coin_type) {
            const hexCoinType = "0x" + coin_type;
            resultList[hexCoinType] = {
                max: fields.max,
                min: fields.min,
                assetId: fields.asset_id,
                poolId: fields.pool_id,
                supplierFee: Number(fields.rate_to_supplier) / 10000,
                flashloanFee: Number(fields.rate_to_treasury) / 10000,
            };
        }
    })));
    return resultList;
});
exports.fetchFlashloanData = fetchFlashloanData;
/**
 * Retrieves pool information for a given coin symbol.
 * @param coinSymbol - The symbol of the coin.
 * @returns The pool information for the specified coin symbol, or all pool information if no coin symbol is provided.
 * @throws If there is an error fetching the pool information.
 */
function getPoolInfo(coin, client) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!client) {
            client = new client_1.SuiClient({
                url: (0, client_1.getFullnodeUrl)("mainnet"),
            });
        }
        try {
            const response = yield axios_1.default.get("https://api-defi.naviprotocol.io/getIndexAssetData");
            const poolInfo = response.data;
            const config = yield (0, address_1.getConfig)();
            const poolResults = {};
            if (coin) {
                const pool_real = address_1.pool[coin.symbol];
                const poolId = String(pool_real.assetId);
                return yield (0, exports.fetchPoolData)({
                    poolId,
                    reserveParentId: config.ReserveParentId,
                    client,
                    poolInfo,
                });
            }
            else {
                for (const poolId in poolInfo) {
                    if (poolInfo.hasOwnProperty(poolId)) {
                        poolResults[poolId] = yield (0, exports.fetchPoolData)({
                            poolId,
                            reserveParentId: config.ReserveParentId,
                            client,
                            poolInfo,
                        });
                    }
                }
                return poolResults;
            }
        }
        catch (error) {
            console.error("Error fetching pool information:", error);
            throw error;
        }
    });
}
/**
 * Retrieves the latest protocol package ID from the Navi Protocol API.
 * @returns The latest protocol package ID.
 */
function getLatestProtocolPackageId() {
    return __awaiter(this, void 0, void 0, function* () {
        const apiUrl = "https://open-api.naviprotocol.io/api/package";
        try {
            const response = yield fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API call failed with status ${response.status}`);
            }
            const data = yield response.json();
            return data.packageId;
        }
        catch (error) {
            console.error("Failed to update ProtocolPackage:");
            return "";
        }
    });
}
function getUserRewardHistory(userAddress_1) {
    return __awaiter(this, arguments, void 0, function* (userAddress, page = 1, size = 400) {
        var _a, _b;
        const endpoint = `https://open-api.naviprotocol.io/api/navi/user/rewards?userAddress=${userAddress}&page=${page}&pageSize=${size}`;
        console.log(endpoint);
        try {
            const response = yield axios_1.default.get(endpoint);
            const rewards = ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.rewards) || [];
            // Process and return the rewards data as needed
            return rewards;
        }
        catch (error) {
            console.error("Error fetching user reward history:", error);
            throw error;
        }
    });
}
function getPoolsInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const poolInfoUrl = `https://open-api.naviprotocol.io/api/navi/pools`;
        try {
            const response = yield axios_1.default.get(poolInfoUrl);
            if (response.data.code === 0) {
                return response.data.data;
            }
            else {
                return null;
            }
        }
        catch (error) {
            console.error("Error fetching pools information:", error);
            return null;
        }
    });
}
function fetchCoinPrices(coinTypes_1) {
    return __awaiter(this, arguments, void 0, function* (coinTypes, isInternal = false, Token, maxRetries = 3, delayTime = 1000) {
        if (coinTypes.length === 0) {
            console.warn("No coin types provided.");
            return null;
        }
        let API_URL = "https://open-aggregator-api.naviprotocol.io/coins/price";
        if (isInternal) {
            API_URL = "https://aggregator-api.naviprotocol.io/coins/price";
        }
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const fetchChunk = (chunk) => __awaiter(this, void 0, void 0, function* () {
            const attemptFetch = (retries) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const url = `${API_URL}?coinType=${chunk.join(",")}`;
                    const headers = {};
                    if (!isInternal && Token) {
                        headers["x-navi-token"] = Token;
                    }
                    const response = yield fetch(url, { method: "GET", headers });
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const jsonData = yield response.json();
                    const adjustedPrices = jsonData.data.list.map((price) => {
                        if (price.coinType === "0x2::sui::SUI") {
                            return Object.assign(Object.assign({}, price), { coinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI" });
                        }
                        return price;
                    });
                    return adjustedPrices;
                }
                catch (error) {
                    if (retries <= 0) {
                        console.error("Failed to fetch coin prices after multiple attempts:", error);
                        return null;
                    }
                    console.warn(`Attempt failed for chunk, retrying... (${maxRetries - retries + 1}/${maxRetries})`);
                    yield delay(delayTime);
                    return attemptFetch(retries - 1);
                }
            });
            return attemptFetch(maxRetries);
        });
        const chunkSize = 10;
        const chunkPromises = [];
        for (let i = 0; i < coinTypes.length; i += chunkSize) {
            const chunk = coinTypes.slice(i, i + chunkSize);
            chunkPromises.push(fetchChunk(chunk));
        }
        const chunkResults = yield Promise.all(chunkPromises);
        const results = [];
        for (const chunkResult of chunkResults) {
            if (chunkResult) {
                results.push(...chunkResult);
            }
        }
        return results;
    });
}
function getAllPools() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get("https://open-api.naviprotocol.io/api/navi/pools");
            if (response.data.code !== 0) {
                throw new Error(`API returned error code: ${response.data.code}`);
            }
            const poolData = response.data.data;
            const res = {};
            for (const pool of poolData) {
                res[(0, utils_1.normalizeStructTag)(pool.token.coinType)] = pool;
            }
            return res;
        }
        catch (error) {
            console.error("Error fetching pool data:", error);
            throw new Error(`Failed to fetch pool data: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    });
}

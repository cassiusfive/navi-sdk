interface BaseRewardFields {
    asset_coin_type: string;
    reward_coin_type: string;
    rule_ids: string[];
}
interface BaseRule {
    ruleId: string;
    option: number;
    optionType?: string;
    rewardCoinType: string;
    rewardSymbol?: string;
    rewardDecimal?: number;
    rate: string;
    ratePerWeek?: number | null;
    enable: boolean;
}
/** ========== Interfaces ========== */
export interface Reward extends BaseRewardFields {
    user_claimable_reward: string | number;
    user_claimed_reward?: string;
    option?: number;
}
export interface ClaimRewardInput {
    reward_coin_type: string;
    asset_vector: string[];
    rules_vector: string[];
}
export interface ProcessedReward {
    asset_id: string;
    reward_id: string;
    reward_coin_type: string;
    option?: number;
    rule_ids: string[];
    user_claimable_reward: number;
    user_claimed_reward?: number;
}
export interface GroupedRewards {
    [asset_coin_type: string]: ProcessedRewardsList;
}
export interface RewardsList extends Array<Reward> {
}
export interface ProcessedRewardsList extends Array<ProcessedReward> {
}
export interface GroupedAssetPool {
    asset: number;
    assetSymbol: string;
    assetCoinType: string;
    rules: BaseRule[];
}
export interface ComputedRule extends BaseRule {
}
export interface IncentiveApyInfo {
    rewardCoin: string[];
    apy: number;
}
export interface ApyResult {
    asset: number;
    assetCoinType: string;
    supplyIncentiveApyInfo: IncentiveApyInfo;
    borrowIncentiveApyInfo: IncentiveApyInfo;
}
interface Rule {
    enable: boolean;
    global_index: string;
    id: {
        id: string;
    };
    last_update_at: string;
    max_rate: string;
    option: number;
    rate: string;
    reward_coin_type: string;
}
interface AssetPool {
    asset: number;
    asset_coin_type: string;
    id: {
        id: string;
    };
    rules: {
        fields: {
            contents: Array<{
                fields: {
                    key: string;
                    value: {
                        fields: Rule;
                    };
                };
            }>;
        };
    };
}
interface Pools {
    fields: {
        contents: Array<{
            fields: {
                key: string;
                value: {
                    fields: AssetPool;
                };
            };
        }>;
    };
}
export interface IncentiveData {
    data: {
        content: {
            fields: {
                pools: Pools;
            };
        };
    };
}
export interface ReserveData {
    id: number;
    oracle_id: number;
    coin_type: string;
    supply_cap: string;
    borrow_cap: string;
    supply_rate: string;
    borrow_rate: string;
    supply_index: string;
    borrow_index: string;
    total_supply: string;
    total_borrow: string;
    last_update_at: string;
    ltv: string;
    treasury_factor: string;
    treasury_balance: string;
    base_rate: string;
    multiplier: string;
    jump_rate_multiplier: string;
    reserve_factor: string;
    optimal_utilization: string;
    liquidation_ratio: string;
    liquidation_bonus: string;
    liquidation_threshold: string;
}
export {};

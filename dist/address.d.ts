import { CoinInfo, PoolConfig } from "./types";
export declare const defaultProtocolPackage = "0x81c408448d0d57b3e371ea94de1d40bf852784d3e225de1e74acab3e8395c18f";
export declare const AddressMap: Record<string, string>;
export declare function getPackageCache(): string;
export declare function isPackageCacheExpired(): boolean;
export declare function setPackageCache(expirationLength?: number): Promise<void>;
export declare const getConfig: () => Promise<{
    ProtocolPackage: string;
    StorageId: string;
    IncentiveV2: string;
    IncentiveV3: string;
    PriceOracle: string;
    ReserveParentId: string;
    uiGetter: string;
    flashloanConfig: string;
    flashloanSupportedAssets: string;
}>;
export declare const pool: {
    [key: string]: PoolConfig;
};
export declare const flashloanConfig: {
    id: string;
};
export declare const NAVX: CoinInfo;
export declare const Sui: CoinInfo;
export declare const vSui: CoinInfo;
export declare const USDT: CoinInfo;
export declare const WETH: CoinInfo;
export declare const CETUS: CoinInfo;
export declare const haSui: CoinInfo;
export declare const WBTC: CoinInfo;
export declare const AUSD: CoinInfo;
export declare const wUSDC: CoinInfo;
export declare const nUSDC: CoinInfo;
export declare const ETH: CoinInfo;
export declare const USDY: CoinInfo;
export declare const NS: CoinInfo;
export declare const LorenzoBTC: CoinInfo;
export declare const DEEP: CoinInfo;
export declare const FDUSD: CoinInfo;
export declare const BLUE: CoinInfo;
export declare const BUCK: CoinInfo;
export declare const suiUSDT: CoinInfo;
export declare const stSUI: CoinInfo;
export declare const suiBTC: CoinInfo;
export declare const WSOL: CoinInfo;
export declare const LBTC: CoinInfo;
export declare const WAL: CoinInfo;
export declare const HAEDAL: CoinInfo;
export declare const XBTC: CoinInfo;
export declare const vSuiConfig: {
    ProtocolPackage: string;
    pool: string;
    metadata: string;
    wrapper: string;
};
export interface IPriceFeed {
    oracleId: number;
    maxTimestampDiff: number;
    priceDiffThreshold1: number;
    priceDiffThreshold2: number;
    maxDurationWithinThresholds: number;
    maximumAllowedSpanPercentage: number;
    maximumEffectivePrice: number;
    minimumEffectivePrice: number;
    historicalPriceTTL: number;
    coinType: string;
    feedId: string;
    supraPairId: number;
    pythPriceFeedId: string;
    pythPriceInfoObject: string;
    priceDecimal: number;
    expiration: number;
}
export declare const PriceFeedConfig: {
    [key: string]: IPriceFeed;
};
export interface IOracleProConfig {
    PackageId: string;
    PriceOracle: string;
    OracleAdminCap: string;
    OracleConfig: string;
    PythStateId: string;
    WormholeStateId: string;
    SupraOracleHolder: string;
    Sender: string;
    GasObject: string;
}
export declare const OracleProConfig: IOracleProConfig;
export declare const ProFundsPoolInfo: Record<string, {
    coinType: string;
    oracleId: number;
}>;
export declare const noDepositCoinType: string[];

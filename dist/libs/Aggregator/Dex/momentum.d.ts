import { Transaction } from "@mysten/sui/transactions";
export declare function makeMomentumPTB(txb: Transaction, poolId: string, pathTempCoin: any, amount: any, a2b: boolean, typeArguments: string[]): Promise<{
    $kind: "NestedResult";
    NestedResult: [number, number];
}>;

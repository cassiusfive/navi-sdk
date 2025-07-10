import { type SuiTransport, type SuiTransportRequestOptions } from "@mysten/sui/client";
export declare class NAVIHttpTransport implements SuiTransport {
    requestId: number;
    rpcUrl: string;
    constructor(rpcUrl: string);
    request<T>(input: SuiTransportRequestOptions): Promise<T>;
    subscribe<T>(): Promise<() => Promise<boolean>>;
}

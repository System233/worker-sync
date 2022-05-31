export declare class SyncWorkerError extends Error {
}
declare type KeyOfType<T, F> = {
    [K in keyof T]: T[K] extends F ? K : never;
}[keyof T];
declare type PromiseResultType<T> = T extends Promise<infer R> ? R : never;
export declare const DEFAULT_NAMESPACE = "$SyncWorker";
export interface SyncWorkerSerializer<T = any> {
    serialize(data: T, buffer: Uint8Array): number;
    deserialize(buffer: Uint8Array, length: number): T;
}
export interface SyncWorkerData {
    namespace: string;
    method: string;
    buffer: SharedArrayBuffer;
}
export declare class SyncWorkerJSONSerializer implements SyncWorkerSerializer {
    encoder: TextEncoder;
    decoder: TextDecoder;
    constructor();
    serialize(data: any, buffer: Uint8Array): number;
    deserialize(data: Uint8Array, length: number): any;
}
export interface SyncWorkerOption {
    namespace?: string;
    timeout?: number;
    serializer?: SyncWorkerSerializer;
    length?: number;
}
export declare class SyncWorker<T extends Record<string, any>> {
    postMessage: (value: any) => any;
    buffer: SharedArrayBuffer;
    lock: Int32Array;
    bufferView: Uint8Array;
    namespace: string;
    timeout: number;
    serializer: SyncWorkerSerializer;
    constructor(postMessage: (value: any) => any, option?: SyncWorkerOption);
    private serialize;
    private deserialize;
    call<K extends KeyOfType<T, (...args: any) => any>>(method: K, ...args: Parameters<T[K]>): PromiseResultType<ReturnType<T[K]>>;
    request<K extends KeyOfType<T, (...args: any) => any>>(method: K, args: Parameters<T[K]>, timeout?: number): PromiseResultType<ReturnType<T[K]>>;
}
export interface SyncWorkerHandlerOption {
    namespace?: string;
    serializer?: SyncWorkerSerializer;
}
export declare class SyncWorkerHandler<T extends Record<string, any>> {
    handler: T;
    namespace: string;
    serializer: SyncWorkerSerializer;
    constructor(handler: T, option?: SyncWorkerHandlerOption);
    handle(method: string, buffer: SharedArrayBuffer): Promise<void>;
    dispatch(data: SyncWorkerData): void;
}
export {};

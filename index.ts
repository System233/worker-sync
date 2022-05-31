// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT


export class SyncWorkerError extends Error { }
type KeyOfType<T, F> = { [K in keyof T]: T[K] extends F ? K : never }[keyof T];
type PromiseResultType<T>=T extends Promise<infer R>?R:never;
export const DEFAULT_NAMESPACE = "$SyncWorker";
export interface SyncWorkerSerializer<T = any> {
    serialize(data: T, buffer: Uint8Array): number;
    deserialize(buffer: Uint8Array, length: number): T;
}
export interface SyncWorkerData {
    namespace: string;
    method: string;
    buffer: SharedArrayBuffer;
}
export class SyncWorkerJSONSerializer implements SyncWorkerSerializer {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    constructor() { }
    serialize(data: any, buffer: Uint8Array): number {
        return this.encoder.encodeInto(JSON.stringify(data), buffer).written;
    }
    deserialize(data: Uint8Array, length: number) {
        return JSON.parse(this.decoder.decode(data.subarray(0, length)));
    }
}
export interface SyncWorkerOption {
    namespace?: string;
    timeout?: number;
    serializer?: SyncWorkerSerializer;
    length?: number;
};
export class SyncWorker<T extends Record<string, any>>{
    buffer: SharedArrayBuffer;
    lock: Int32Array;
    bufferView: Uint8Array;
    namespace: string;
    timeout: number;
    serializer: SyncWorkerSerializer;
    constructor(public postMessage: (value:any)=>any, option?: SyncWorkerOption) {
        this.buffer = new SharedArrayBuffer(option?.length || 4096);
        this.lock = new Int32Array(this.buffer, 0, 1);
        this.bufferView = new Uint8Array(this.buffer, this.lock.byteLength);
        this.timeout = option?.timeout;
        this.namespace = option?.namespace ?? DEFAULT_NAMESPACE;
        this.serializer = option?.serializer || new SyncWorkerJSONSerializer;
    }
    private serialize(args: any) {
        this.lock[0] = this.serializer.serialize(args, this.bufferView);
    }
    private deserialize() {
        const length = Math.abs(this.lock[0]);
        const data = this.serializer.deserialize(this.bufferView, length);
        if (this.lock[0] < 0) {
            throw new Error(data);
        }
        return data;
    }
    call<K extends KeyOfType<T, (...args: any) => any>>(method: K, ...args: Parameters<T[K]>): PromiseResultType<ReturnType<T[K]>> {
        return this.request(method, args,this.timeout);
    }
    request<K extends KeyOfType<T, (...args: any) => any>>(method: K, args: Parameters<T[K]>, timeout?: number): PromiseResultType<ReturnType<T[K]>> {
        timeout = timeout ?? this.timeout;
        this.serialize(args);
        this.postMessage({
            namespace: this.namespace,
            method,
            buffer: this.buffer
        });
        const status = Atomics.wait(this.lock, 0, this.lock[0], timeout);
        if (status == 'timed-out') {
            throw new SyncWorkerError('request timeout: ' + timeout);
        }
        return this.deserialize();
    }

}
export interface SyncWorkerHandlerOption {
    namespace?: string;
    serializer?: SyncWorkerSerializer;
};
export class SyncWorkerHandler<T extends Record<string, any>>{
    namespace: string;
    serializer: SyncWorkerSerializer;
    // dispatcher: (data: SyncWorkerData) => void;
    constructor(public handler: T, option?: SyncWorkerHandlerOption) {
        this.namespace = option?.namespace ?? DEFAULT_NAMESPACE;
        this.serializer = option?.serializer || new SyncWorkerJSONSerializer;
    }

    async handle(method: string, buffer: SharedArrayBuffer) {
        const lock = new Int32Array(buffer, 0, 1);
        const data = new Uint8Array(buffer, lock.byteLength);
        try {
            const args = this.serializer.deserialize(data, lock[0]);
            const result = await this.handler[method](...args);
            const length = this.serializer.serialize(result, data);
            Atomics.store(lock, 0, length);
        } catch (error) {
            const length = this.serializer.serialize(error.stack, data);
            Atomics.store(lock, 0, -length);
        }
        Atomics.notify(lock, 0);
    }
    dispatch(data: SyncWorkerData) {
        const { namespace } = data;
        if (this.namespace == namespace) {
            const { method, buffer } = data;
            this.handle(method, buffer);
        }
    }
}
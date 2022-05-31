// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
export class SyncWorkerError extends Error {
}
export const DEFAULT_NAMESPACE = "$SyncWorker";
export class SyncWorkerJSONSerializer {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    constructor() { }
    serialize(data, buffer) {
        return this.encoder.encodeInto(JSON.stringify(data), buffer).written;
    }
    deserialize(data, length) {
        return JSON.parse(this.decoder.decode(data.subarray(0, length)));
    }
}
;
export class SyncWorker {
    postMessage;
    buffer;
    lock;
    bufferView;
    namespace;
    timeout;
    serializer;
    constructor(postMessage, option) {
        this.postMessage = postMessage;
        this.buffer = new SharedArrayBuffer(option?.length || 4096);
        this.lock = new Int32Array(this.buffer, 0, 1);
        this.bufferView = new Uint8Array(this.buffer, this.lock.byteLength);
        this.timeout = option?.timeout;
        this.namespace = option?.namespace ?? DEFAULT_NAMESPACE;
        this.serializer = option?.serializer || new SyncWorkerJSONSerializer;
    }
    serialize(args) {
        this.lock[0] = this.serializer.serialize(args, this.bufferView);
    }
    deserialize() {
        const length = Math.abs(this.lock[0]);
        const data = this.serializer.deserialize(this.bufferView, length);
        if (this.lock[0] < 0) {
            throw new Error(data);
        }
        return data;
    }
    call(method, ...args) {
        return this.request(method, args, this.timeout);
    }
    request(method, args, timeout) {
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
;
export class SyncWorkerHandler {
    handler;
    namespace;
    serializer;
    // dispatcher: (data: SyncWorkerData) => void;
    constructor(handler, option) {
        this.handler = handler;
        this.namespace = option?.namespace ?? DEFAULT_NAMESPACE;
        this.serializer = option?.serializer || new SyncWorkerJSONSerializer;
    }
    async handle(method, buffer) {
        const lock = new Int32Array(buffer, 0, 1);
        const data = new Uint8Array(buffer, lock.byteLength);
        try {
            const args = this.serializer.deserialize(data, lock[0]);
            const result = await this.handler[method](...args);
            const length = this.serializer.serialize(result, data);
            Atomics.store(lock, 0, length);
        }
        catch (error) {
            const length = this.serializer.serialize(error.stack, data);
            Atomics.store(lock, 0, -length);
        }
        Atomics.notify(lock, 0);
    }
    dispatch(data) {
        const { namespace } = data;
        if (this.namespace == namespace) {
            const { method, buffer } = data;
            this.handle(method, buffer);
        }
    }
}

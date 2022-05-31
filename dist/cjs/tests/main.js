"use strict";
// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const worker_threads_1 = require("worker_threads");
const worker = new worker_threads_1.Worker(require.resolve('./worker'));
worker.unref();
const sync = new __1.SyncWorker(x => worker.postMessage(x));
const result = sync.call('concat', 'A', 'B');
console.log(result);
try {
    sync.call('error', 'test error');
}
catch (error) {
    console.log('TEST ERROR OK');
}

"use strict";
// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const common_1 = require("./common");
const worker_threads_1 = require("worker_threads");
const handler = new __1.SyncWorkerHandler(new common_1.Test);
worker_threads_1.parentPort.on('message', value => handler.dispatch(value));

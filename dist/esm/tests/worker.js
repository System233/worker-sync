// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { SyncWorkerHandler } from "..";
import { Test } from "./common";
import { parentPort } from 'worker_threads';
const handler = new SyncWorkerHandler(new Test);
parentPort.on('message', value => handler.dispatch(value));

// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import {SyncWorker} from '..'
import {Worker} from 'worker_threads'
import { Test } from './common';


const worker=new Worker(require.resolve('./worker'));
worker.unref();

const sync=new SyncWorker<Test>(x=>worker.postMessage(x));

const result=sync.call('concat','A','B');
console.log(result);
try {
    sync.call('error','test error');
} catch (error) {
    console.log('TEST ERROR OK')
}

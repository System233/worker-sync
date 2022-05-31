"use strict";
// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
class Test {
    async concat(x, y) {
        return x + y;
    }
    async error(message) {
        throw new Error(message);
    }
}
exports.Test = Test;

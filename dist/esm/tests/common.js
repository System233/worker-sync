// Copyright (c) 2022 System233
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
export class Test {
    async concat(x, y) {
        return x + y;
    }
    async error(message) {
        throw new Error(message);
    }
}

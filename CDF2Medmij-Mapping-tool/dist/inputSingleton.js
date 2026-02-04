"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSingleton = void 0;
const async_mutex_1 = require("async-mutex");
class InputSingleton {
    static instance;
    input;
    mutex;
    constructor() {
        // initialize singleton instance
        this.mutex = new async_mutex_1.Mutex();
    }
    setInput(input) {
        //replace empty spaces in the input data with 'undefined'
        for (const variable in input) {
            for (const assessment in input[variable]) {
                if (input[variable][assessment]?.trim() === '')
                    input[variable][assessment] = undefined;
            }
        }
        this.input = input;
    }
    getInput(varName) {
        return this.input[varName];
    }
    getMutex() {
        return this.mutex;
    }
    static getInstance() {
        if (!InputSingleton.instance) {
            InputSingleton.instance = new InputSingleton();
        }
        return InputSingleton.instance;
    }
}
exports.InputSingleton = InputSingleton;
//# sourceMappingURL=inputSingleton.js.map
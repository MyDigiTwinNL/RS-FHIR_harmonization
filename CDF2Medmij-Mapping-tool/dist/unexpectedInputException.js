"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedInputException = void 0;
exports.failIsDefined = failIsDefined;
exports.assertIsDefined = assertIsDefined;
class UnexpectedInputException extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputDataException';
    }
}
exports.UnexpectedInputException = UnexpectedInputException;
function failIsDefined(message) {
    throw new UnexpectedInputException(message);
}
function assertIsDefined(value, message) {
    if (value === undefined) {
        throw new UnexpectedInputException(message);
    }
}
//# sourceMappingURL=unexpectedInputException.js.map
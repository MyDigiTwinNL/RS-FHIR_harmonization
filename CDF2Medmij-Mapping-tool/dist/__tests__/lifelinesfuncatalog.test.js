"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lifelinesFunctions_1 = require("../lifelinesFunctions");
test('Mean between dates', () => {
    const date1 = "2001-5";
    const date2 = "2003-5";
    expect((0, lifelinesFunctions_1.lifelinesMeanDate)(date1, date2)).toBe("2002-5");
});
//# sourceMappingURL=lifelinesfuncatalog.test.js.map
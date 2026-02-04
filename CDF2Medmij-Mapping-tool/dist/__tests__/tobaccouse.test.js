"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const inputSingleton_1 = require("../inputSingleton");
const tobbacousemf = __importStar(require("../lifelines/TobaccoUse"));
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const mapper_1 = require("../mapper");
test('non-smoker', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_startage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "ever_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "total_frequency_adu_c_1": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "packyears_cumulative_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5" },
        "age": { "1a": "22" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const mappingResult = tobbacousemf.results();
    expect(mappingResult[0].useStatus === snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.non_smoker);
});
test('participant was an ex-smoker before the first assessment', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_startage_adu_c_2": { "1a": "20", "1b": "20", "1c": "20", "2a": "20", "2b": "20", "3a": "20" },
        "ex_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "smoking_endage_adu_c_2": { "1a": "30", "1b": "30", "1c": "30", "2a": "30", "2b": "30", "3a": "30" },
        "ever_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "total_frequency_adu_c_1": { "1a": "5", "1b": "5", "1c": "5", "2a": "5", "2b": "5", "3a": "5" },
        "packyears_cumulative_adu_c_2": { "1a": "200", "1b": "200", "1c": "200", "2a": "200", "2b": "200", "3a": "200" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "40" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const mappingResult = tobbacousemf.results();
    expect(mappingResult[0].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.ex_smoker);
    expect(mappingResult[0].smokingStartDate).toBe("1972");
    expect(mappingResult[0].smokingEndDate).toBe("1982");
});
test('participant started smoking before the baseline assessment and was still a smoker in the last assessment', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "smoking_startage_adu_c_2": { "1a": "20", "1b": "20", "1c": "20", "2a": "20", "2b": "20", "3a": "20" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "ever_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "total_frequency_adu_c_1": { "1a": "5", "1b": "5", "1c": "5", "2a": "5", "2b": "5", "3a": "5" },
        "packyears_cumulative_adu_c_2": { "1a": "200", "1b": "200", "1c": "200", "2a": "200", "2b": "200", "3a": "200" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "40" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const mappingResult = tobbacousemf.results();
    expect(mappingResult[0].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.daily);
    expect(mappingResult[0].smokingStartDate).toBe("1972");
});
test('participant started smoking after the baseline assessment and was still a smoker in the last assessment', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "1", "2b": "1", "3a": "1" },
        "smoking_startage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "20", "2b": "20", "3a": "20" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "ever_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "1", "2b": "1", "3a": "1" },
        "total_frequency_adu_c_1": { "1a": "", "1b": "", "1c": "", "2a": "5", "2b": "5", "3a": "5" },
        "packyears_cumulative_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "200", "2b": "200", "3a": "200" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "40" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const mappingResult = tobbacousemf.results();
    expect(mappingResult[0].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.non_smoker);
    expect(mappingResult[3].assessment).toBe("2a");
    expect(mappingResult[3].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.daily);
    expect(mappingResult[3].smokingStartDate).toBe("1972");
});
test('participant started smoking after the baseline assessment and quit smoking before the last assessment', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "0", "1b": "1", "1c": "1", "2a": /*ex-smoker*/ "0", "2b": "0", "3a": "0" },
        "smoking_startage_adu_c_2": { "1a": "", "1b": "42", "1c": "42", "2a": "42", "2b": "42", "3a": "42" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": /*ex-smoker*/ "1", "2b": "1", "3a": "1" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "48", "2b": "48", "3a": "48" },
        "ever_smoker_adu_c_2": { "1a": "0", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "total_frequency_adu_c_1": { "1a": "", "1b": "5", "1c": "5", "2a": "", "2b": "", "3a": "" },
        "packyears_cumulative_adu_c_2": { "1a": "", "1b": "200", "1c": "200", "2a": "200", "2b": "200", "3a": "200" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "40" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const mappingResult = tobbacousemf.results();
    expect(mappingResult[0].assessment).toBe("1a");
    expect(mappingResult[0].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.non_smoker);
    expect(mappingResult[1].assessment).toBe("1b");
    expect(mappingResult[1].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.daily);
    expect(mappingResult[1].smokingStartDate).toBe("1994");
    expect(mappingResult[3].assessment).toBe("2a");
    expect(mappingResult[3].useStatus).toBe(snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.ex_smoker);
    expect(mappingResult[1].smokingStartDate).toBe("1994");
    expect(mappingResult[3].smokingEndDate).toBe("2000");
});
/**
 * The following tests are intended only for identifying problems between the TobaccoUse module with
 * its corresponding JSONata template, which would lead to a JSONata-library error (test failures).
 */
test('Resource generation - participant started smoking before the baseline assessment and was still a smoker in the last assessment', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "smoking_startage_adu_c_2": { "1a": "20", "1b": "20", "1c": "20", "2a": "20", "2b": "20", "3a": "20" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "" },
        "ever_smoker_adu_c_2": { "1a": "1", "1b": "1", "1c": "1", "2a": "1", "2b": "1", "3a": "1" },
        "total_frequency_adu_c_1": { "1a": "5", "1b": "5", "1c": "5", "2a": "5", "2b": "5", "3a": "5" },
        "packyears_cumulative_adu_c_2": { "1a": "200", "1b": "200", "1c": "200", "2a": "200", "2b": "200", "3a": "200" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "40" },
        "project_pseudo_id": { "1a": "520681571" }
    };
    const targets = [
        { "template": './zib-2017-mappings/TobaccoUse.jsonata', "module": './lifelines/TobaccoUse' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(6);
    });
});
test('Resource generation - non-smoker', () => {
    const input = {
        "current_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0", "3b": "0" },
        "smoking_startage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "", "3b": "" },
        "ex_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0", "3b": "0" },
        "smoking_endage_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "", "3b": "" },
        "ever_smoker_adu_c_2": { "1a": "0", "1b": "0", "1c": "0", "2a": "0", "2b": "0", "3a": "0", "3b": "0" },
        "total_frequency_adu_c_1": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "", "3b": "" },
        "packyears_cumulative_adu_c_2": { "1a": "", "1b": "", "1c": "", "2a": "", "2b": "", "3a": "", "3b": "" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "2b": "2003-5", "3a": "2005-5", "3b": "2009-5" },
        "age": { "1a": "22" },
        "project_pseudo_id": { "1a": "520681571" }
    };
    const targets = [
        { "template": './zib-2017-mappings/TobaccoUse.jsonata', "module": './lifelines/TobaccoUse' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(6);
    });
});
//# sourceMappingURL=tobaccouse.test.js.map
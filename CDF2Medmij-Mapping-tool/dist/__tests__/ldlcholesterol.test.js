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
const cholesterolmf = __importStar(require("../lifelines/LDLCholesterol"));
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const mapper_1 = require("../mapper");
test('Cholesterol reports, above reference range', () => {
    const input = {
        "ldlchol_result_all_m_1": { "1a": (cholesterolmf.referenceRangeUpperLimit() + 0.1).toString(), "2a": (cholesterolmf.referenceRangeUpperLimit() + 0.1).toString() },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = cholesterolmf.results();
    expect(results.length).toBe(2);
    expect(results[0].isLDLAboveReferenceRange).toBe(true);
    expect(results[0].resultFlags).toBe(snomedCodeLists_1.testResultFlagsSNOMEDCodelist.above_reference_range);
    expect(results[1].isLDLAboveReferenceRange).toBe(true);
    expect(results[1].resultFlags).toBe(snomedCodeLists_1.testResultFlagsSNOMEDCodelist.above_reference_range);
});
test('Cholesterol reports, mix of normal and above reference ranges', () => {
    const input = {
        "ldlchol_result_all_m_1": { "1a": (cholesterolmf.referenceRangeUpperLimit() - 0.1).toString(), "2a": (cholesterolmf.referenceRangeUpperLimit() + 0.1).toString() },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = cholesterolmf.results();
    expect(results.length).toBe(2);
    expect(results[0].isLDLAboveReferenceRange).toBe(false);
    expect(results[0].resultFlags).toStrictEqual(undefined);
    expect(results[1].isLDLAboveReferenceRange).toBe(true);
    expect(results[1].resultFlags).toBe(snomedCodeLists_1.testResultFlagsSNOMEDCodelist.above_reference_range);
});
test('Cholesterol reports, within normal levels', () => {
    const input = {
        "ldlchol_result_all_m_1": { "1a": (cholesterolmf.referenceRangeUpperLimit() - 1).toString(), "2a": (cholesterolmf.referenceRangeUpperLimit() - 0.1).toString() },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = cholesterolmf.results();
    expect(results.length).toBe(2);
    expect(results[0].isLDLAboveReferenceRange).toBe(false);
    expect(results[0].resultFlags).toStrictEqual(undefined);
    expect(results[1].isLDLAboveReferenceRange).toBe(false);
    expect(results[1].resultFlags).toStrictEqual(undefined);
});
test('LDLCholesteron resource generation', () => {
    const input = {
        "ldlchol_result_all_m_1": { "1a": (cholesterolmf.referenceRangeUpperLimit() - 1).toString(), "2a": (cholesterolmf.referenceRangeUpperLimit() - 0.1).toString() },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
        "project_pseudo_id": { "1a": "520681571" },
    };
    let targets = [
        { "template": './zib-2017-mappings/LDLCholesterol_Diagnostic_Report.jsonata', "module": './lifelines/LDLCholesterol' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
    targets = [
        { "template": './zib-2017-mappings/LDLCholesterol_Observation.jsonata', "module": './lifelines/LDLCholesterol' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
    targets = [
        { "template": './zib-2017-mappings/LDLCholesterol_Specimen.jsonata', "module": './lifelines/LDLCholesterol' }
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
});
//# sourceMappingURL=ldlcholesterol.test.js.map
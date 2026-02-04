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
const hdlcholesterolmf = __importStar(require("../lifelines/HDLCholesterol"));
const mapper_1 = require("../mapper");
test('HDL Cholesterol reports, below reference lower limit', () => {
    const input = {
        "hdlchol_result_all_m_1": { "1a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() - 0.1), "2a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() - 0.5) },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = hdlcholesterolmf.hdlCholesterol.results();
    expect(results.length).toBe(2);
    expect(results[0].resultFlags?.display).toBe("Below reference range");
    expect(results[1].resultFlags?.display).toBe("Below reference range");
});
test('HDL Cholesterol reports, mix of normal and above reference ranges', () => {
    const input = {
        "hdlchol_result_all_m_1": { "1a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() + 0.1), "2a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() - 0.1) },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = hdlcholesterolmf.hdlCholesterol.results();
    expect(results.length).toBe(2);
    expect(results[0].resultFlags).toStrictEqual(undefined);
    expect(results[1].resultFlags?.display).toBe("Below reference range");
});
test('HDL cholesterol reports, within normal levels', () => {
    const input = {
        "hdlchol_result_all_m_1": { "1a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() + 0.1), "2a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() + 0.5) },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = hdlcholesterolmf.hdlCholesterol.results();
    expect(results.length).toBe(2);
    expect(results[0].resultFlags).toStrictEqual(undefined);
    expect(results[1].resultFlags).toStrictEqual(undefined);
});
/**
 * This tests only checks the module and its related templates work together, with no errors.
 * FHIR-specific validations are expected to be done using the HL7 tools
 */
test('HDLCholesterol resource generation ()', () => {
    const input = {
        "hdlchol_result_all_m_1": { "1a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() + 0.1), "2a": "" + (hdlcholesterolmf.hdlCholesterol.referenceRangeLowerLimit() - 0.1) },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
        "project_pseudo_id": { "1a": "520681571" },
    };
    let targets = [
        { "template": './zib-2017-mappings/generic/LabTestResult_Diagnostic_Report.jsonata', "module": './lifelines/HDLCholesterol' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
    targets = [
        { "template": './zib-2017-mappings/generic/LabTestResult_Observation.jsonata', "module": './lifelines/HDLCholesterol' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
    targets = [
        { "template": './zib-2017-mappings/generic/LabTestResult_Specimen.jsonata', "module": './lifelines/HDLCholesterol' }
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(2);
    });
});
//# sourceMappingURL=hdlcholesterol.test.js.map
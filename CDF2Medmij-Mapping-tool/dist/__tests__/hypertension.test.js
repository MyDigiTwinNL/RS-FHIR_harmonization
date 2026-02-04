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
const hypertensionmf = __importStar(require("../lifelines/Hypertension"));
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const mapper_1 = require("../mapper");
test('hypertension reported on assessment 3A', () => {
    const input = {
        "hypertension_startage_adu_q_1": { "1a": "", "3a": "23", "3b": "23" },
        "hypertension_presence_adu_q_1": { "1a": "2", "3a": "1", "3b": "1" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    expect(hypertensionmf.isPresent()).toBe(true);
    expect(hypertensionmf.clinicalStatus()).toBe(snomedCodeLists_1.clinicalStatusSNOMEDCodeList.active);
    expect(hypertensionmf.onsetDateTime()).toBe("1993");
});
test('No hypertension reported', () => {
    const input = {
        "hypertension_startage_adu_q_1": { "1a": "", "3a": "", "3b": "" },
        "hypertension_presence_adu_q_1": { "1a": "2", "3a": "2", "3b": "2" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    expect(hypertensionmf.isPresent()).toBe(false);
    expect(hypertensionmf.clinicalStatus()).toStrictEqual({});
});
test('Hypertension resource generation when it is reported', () => {
    const input = {
        "hypertension_startage_adu_q_1": { "1a": "", "3a": "23", "3b": "23" },
        "hypertension_presence_adu_q_1": { "1a": "2", "3a": "1", "3b": "1" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
        "project_pseudo_id": { "1a": "520681571" },
    };
    const targets = [
        { "template": './zib-2017-mappings/Hypertension.jsonata', "module": './lifelines/Hypertension' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(1);
        expect(output[0]).toHaveProperty("id");
        expect(output[0]).toHaveProperty("clinicalStatus");
        expect(output[0]).toHaveProperty("verificationStatus");
        expect(output[0]).toHaveProperty("code.coding[0].system");
        expect(output[0]).toHaveProperty("code.coding[0].code");
        expect(output[0]).toHaveProperty("code.coding[0].display");
        expect(output[0]).toHaveProperty("subject.reference");
        expect(output[0]).toHaveProperty("subject.display");
        expect(output[0]).toHaveProperty("onsetDateTime");
    });
});
test('Hypertension resource generation when no hypertension is reported', () => {
    const input = {
        "hypertension_startage_adu_q_1": { "1a": "", "3a": "", "3b": "" },
        "hypertension_presence_adu_q_1": { "1a": "2", "3a": "2", "3b": "2" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "22" },
        "project_pseudo_id": { "1a": "520681571" },
    };
    const targets = [
        { "template": './zib-2017-mappings/Hypertension.jsonata', "module": './lifelines/Hypertension' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(0);
    });
});
//# sourceMappingURL=hypertension.test.js.map
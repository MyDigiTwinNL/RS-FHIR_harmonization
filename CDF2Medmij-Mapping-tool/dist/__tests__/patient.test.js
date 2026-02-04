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
const patientmf = __importStar(require("../lifelines/Patient"));
const fhirv3codes_1 = require("../codes/fhirv3codes");
const mapper_1 = require("../mapper");
test('Male patient', () => {
    const input = {
        "age": { "1a": "22" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "gender": { "1a": "MALE" },
        "date_of_death": { "global": "2010-2" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    expect(patientmf.birthDate()).toBe("1970");
    expect(patientmf.gender()).toBe(fhirv3codes_1.genderFHIRV3Codes.male);
    expect(patientmf.deceasedDateTime()).toBe("2010-02");
});
test('Female patient, undefined age', () => {
    const input = {
        "age": { "1a": "" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "gender": { "1a": "FEMALE" },
        "date_of_death": { "global": "2010-2" }
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    expect(patientmf.birthDate()).toBe(undefined);
    expect(patientmf.gender()).toBe(fhirv3codes_1.genderFHIRV3Codes.female);
});
test('Patient resource generation', () => {
    const input = {
        "project_pseudo_id": { "1a": "520681571" },
        "age": { "1a": "22" },
        "date": { "1a": "1992-5", "1b": "1995-5", "1c": "1997-5", "2a": "2001-5", "3a": "2003-5", "3b": "2005-5" },
        "gender": { "1a": "MALE" },
        "date_of_death": { "global": "2010-2" }
    };
    const targets = [
        { "template": './zib-2017-mappings/Patient.jsonata', "module": './lifelines/Patient' },
    ];
    (0, mapper_1.processInput)(input, targets).then((output) => {
        expect(output.length).toBe(1);
    });
});
//# sourceMappingURL=patient.test.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlCholesterol = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const codesCollection_1 = require("../codes/codesCollection");
/**
 * A laboratory result describes the result of a laboratory analysis. These are specimen-oriented
 * tests as performed in laboratories such as Clinical Chemistry, Serology, Microbiology, etc.
 * In addition to the results of tests with a singular result, this concept can also contain
 * the results of more complex tests with multiple results or a ‘panel’.
 *
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * hdlchol_result_all_m_1         [X ][  ][  ][X ][  ][  ]
 * ------------------------------------------------------------------
 *
 * @precondition hdlResults is a number (not undefined)
 *
 */
exports.hdlCholesterol = {
    referenceRangeUpperLimit: function () {
        //only lower limit defined for hdl cholesterol
        return undefined;
    },
    referenceRangeLowerLimit: function () {
        return referenceRangeLowerLimit();
    },
    results: function () {
        const waves = ["1a", "2a"];
        //if the assessment was missed, do not evaluate/create the resource
        return waves.filter((wave) => !(0, lifelinesFunctions_1.assesmentMissed)(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            "assessment": wave,
            "resultFlags": resultFlags(wave),
            "testResult": hdlResults(wave),
            "collectedDateTime": (0, lifelinesFunctions_1.collectedDateTime)(wave)
        }));
    },
    diagnosticCategoryCoding: function () {
        //laboratory_report,microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        //"HDLc SerPl-sCnc"
        return [(0, codesCollection_1.getLOINCCode)('14646-4')];
    },
    diagnosticCodeText: function () {
        return "Cholesterol in HDL [Moles/Vol]";
    },
    observationCategoryCoding: function () {
        //"Laboratory test finding (finding)","display": "Serum chemistry test"
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        return [(0, codesCollection_1.getLOINCCode)('14646-4')];
    },
    resultUnit: function () {
        return (0, codesCollection_1.getUCUMCode)('mmol/L');
    },
    labTestName: function () {
        return "hdl-chol";
    }
};
const referenceRangeLowerLimit = function () {
    return 1;
};
/*
Based on HCIM Problem resource:
https://simplifier.net/packages/nictiz.fhir.nl.stu3.zib2017/2.2.13/files/2039136

*/
/**
 * @precondition hdlResults is a number (not undefined)
 * @param wave
 * @returns
 */
const isHDLBelowReferenceRange = function (wave) {
    const hdlres = hdlResults(wave);
    if (hdlResults(wave) != undefined) {
        return Number((0, functionsCatalog_1.inputValue)("hdlchol_result_all_m_1", wave)) < referenceRangeLowerLimit();
    }
    else {
        return undefined;
    }
};
/**
 *
 * @precondition isHDLBelowReferenceRange is true
 * @param wave
 * @returns
 */
const resultFlags = function (wave) {
    if (isHDLBelowReferenceRange(wave)) {
        //below_reference_range
        return (0, codesCollection_1.getSNOMEDCode)('281300000');
    }
    else {
        return undefined;
    }
};
/**
 *
 * @param wave
 * @returns hdl results, or undefined
 */
const hdlResults = function (wave) {
    const hdlres = (0, functionsCatalog_1.inputValue)("hdlchol_result_all_m_1", wave);
    if (hdlres != undefined) {
        return Number(hdlres);
    }
    else {
        return undefined;
    }
};
//# sourceMappingURL=HDLCholesterol.js.map
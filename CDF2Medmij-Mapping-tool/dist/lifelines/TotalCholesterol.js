"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.results = exports.referenceRangeUpperLimit = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const referenceRangeUpperLimit = function () {
    return 5;
};
exports.referenceRangeUpperLimit = referenceRangeUpperLimit;
/*
Based on HCIM Problem resource:
https://simplifier.net/packages/nictiz.fhir.nl.stu3.zib2017/2.2.13/files/2039136

*/
/**
 * It is assumed (from Lifelines data analysis) that when 'date' is missing in an assessment, the
 * participant dropped the study or missed the assessment.
 * @param wave
 * @returns true if the assessment was missed
 */
const missedAsssesment = (wave) => (0, functionsCatalog_1.inputValue)("date", wave) == undefined;
/**
 * A laboratory result describes the result of a laboratory analysis. These are specimen-oriented
 * tests as performed in laboratories such as Clinical Chemistry, Serology, Microbiology, etc.
 * In addition to the results of tests with a singular result, this concept can also contain
 * the results of more complex tests with multiple results or a ‘panel’.
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * cholesterol_result_all_m_1     [X ][  ][  ][X ][  ][  ]
 * ------------------------------------------------------------------
 *
 */
const results = function () {
    const waves = ["1a", "2a"];
    //if the assessment was missed, do not evaluate/create the resource
    return waves.filter((wave) => !missedAsssesment(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
        "assessment": wave,
        "isTotalCholAboveReferenceRange": isTotalCholAboveReferenceRange(wave),
        "resultFlags": resultFlags(wave),
        "totalCholResults": totalCholResults(wave),
        "collectedDateTime": collectedDateTime(wave)
    }));
};
exports.results = results;
const isTotalCholAboveReferenceRange = function (wave) {
    if (totalCholResults(wave) != undefined) {
        return Number((0, functionsCatalog_1.inputValue)("cholesterol_result_all_m_1", wave)) > (0, exports.referenceRangeUpperLimit)();
    }
    else {
        return undefined;
    }
};
const resultFlags = function (wave) {
    if (isTotalCholAboveReferenceRange(wave)) {
        return snomedCodeLists_1.testResultFlagsSNOMEDCodelist.above_reference_range;
    }
    else {
        return undefined;
    }
};
const totalCholResults = function (wave) {
    const totalCholRes = (0, functionsCatalog_1.inputValue)("cholesterol_result_all_m_1", wave);
    if (totalCholRes != undefined) {
        return Number(totalCholRes);
    }
    else {
        return undefined;
    }
};
const collectedDateTime = function (wave) {
    const coldate = (0, functionsCatalog_1.inputValue)("date", wave);
    if (coldate != undefined) {
        return (0, lifelinesFunctions_1.lifelinesDateToISO)(coldate);
    }
    else {
        return undefined;
    }
};
//# sourceMappingURL=TotalCholesterol.js.map
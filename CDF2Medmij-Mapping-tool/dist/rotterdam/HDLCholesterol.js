"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlCholesterol = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Rotterdam Study – HDL cholesterol pairing rules
 *
 * RS CDF variables (per participant, baseline wave "a1"):
 *
 *   HDL_mmol.a1        HDL cholesterol in mmol/L
 *   date_int_cen.a1    baseline examination date (DD-MM-YYYY)
 *
 * This implements the same LaboratoryTestResult interface used for Lifelines,
 * so we can reuse the existing HDL Cholesterol JSONata templates.
 */
/**
 * Convert DD-MM-YYYY (Rotterdam style) → YYYY-MM-DD (FHIR/ISO).
 */
const rsDateToISO = (ddmmyyyy) => {
    if (!ddmmyyyy)
        return undefined;
    const parts = ddmmyyyy.split('-');
    if (parts.length !== 3)
        return undefined;
    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!day || !month || !year)
        return undefined;
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${mm}-${dd}`;
};
/**
 * Safely parse numeric strings, returning undefined for empty/missing/NaN.
 */
const parseNumeric = (value) => {
    if (value === undefined)
        return undefined;
    const trimmed = value.trim();
    if (trimmed === '')
        return undefined;
    const num = Number(trimmed);
    return Number.isNaN(num) ? undefined : num;
};
/**
 * Decide whether HDL is missing for a given assessment.
 * For RS we have a single wave "a1"; if HDL is empty, we skip the resource.
 */
const assessmentMissed = (wave) => {
    const val = (0, functionsCatalog_1.inputValue)('HDL_mmol', wave);
    return val === undefined || val.trim() === '';
};
/**
 * Lower reference limit for HDL (mmol/L);
 * mirrors the Lifelines implementation.
 */
const REFERENCE_RANGE_LOWER_LIMIT = 1;
/**
 * Main export used by the HDL JSONata templates.
 */
exports.hdlCholesterol = {
    referenceRangeUpperLimit: function () {
        // Only lower limit defined for HDL cholesterol
        return undefined;
    },
    referenceRangeLowerLimit: function () {
        return referenceRangeLowerLimit();
    },
    results: function () {
        const waves = ['a1']; // Rotterdam baseline wave
        // If the assessment was missed, do not create the resource
        return waves
            .filter((wave) => !assessmentMissed(wave))
            .map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            assessment: wave,
            resultFlags: resultFlags(wave),
            testResult: hdlResults(wave),
            collectedDateTime: collectedDateTime(wave),
        }));
    },
    diagnosticCategoryCoding: function () {
        // laboratory_report, microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        // "HDLc SerPl-sCnc"
        return [(0, codesCollection_1.getLOINCCode)('14646-4')];
    },
    diagnosticCodeText: function () {
        return 'Cholesterol in HDL [Moles/Vol]';
    },
    observationCategoryCoding: function () {
        // "Laboratory test finding (finding)", "Serum chemistry test"
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        return [(0, codesCollection_1.getLOINCCode)('14646-4')];
    },
    resultUnit: function () {
        return (0, codesCollection_1.getUCUMCode)('mmol/L');
    },
    labTestName: function () {
        return 'hdl-chol';
    },
};
/**
 * Reference range lower limit, in mmol/L.
 */
const referenceRangeLowerLimit = function () {
    return REFERENCE_RANGE_LOWER_LIMIT;
};
/**
 * Is HDL below the reference range?
 *
 * @precondition hdlResults is a number (not undefined)
 */
const isHDLBelowReferenceRange = function (wave) {
    const hdl = hdlResults(wave);
    return hdl !== undefined && hdl < referenceRangeLowerLimit();
};
/**
 * Flag results if HDL is below reference range.
 * Uses SNOMED 281300000 "Below reference range" as in Lifelines.
 */
const resultFlags = function (wave) {
    if (isHDLBelowReferenceRange(wave)) {
        // below_reference_range
        return (0, codesCollection_1.getSNOMEDCode)('281300000');
    }
    else {
        return undefined;
    }
};
/**
 * HDL result (mmol/L) for Rotterdam Study.
 *
 * @param wave baseline wave, e.g. "a1"
 * @returns HDL result, or undefined
 */
const hdlResults = function (wave) {
    const hdl = (0, functionsCatalog_1.inputValue)('HDL_mmol', wave);
    return parseNumeric(hdl);
};
/**
 * Collection date/time for HDL measurement – use baseline exam date.
 *
 * @param wave baseline wave, e.g. "a1"
 */
const collectedDateTime = function (wave) {
    const date = (0, functionsCatalog_1.inputValue)('date_int_cen', wave);
    (0, unexpectedInputException_1.assertIsDefined)(date, `Precondition failed - HDL cholesterol: missing date_int_cen in assessment ${wave}`);
    return rsDateToISO(date);
};
//# sourceMappingURL=HDLCholesterol.js.map
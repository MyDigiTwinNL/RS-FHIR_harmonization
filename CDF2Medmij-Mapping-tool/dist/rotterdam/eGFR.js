"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eGFR = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Rotterdam Study – eGFR pairing rules
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   GFR.a1             eGFR (mL/min/1.73m2)
 *   date_int_cen.a1    Baseline exam date (DD-MM-YYYY)
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
 * Safely parse numeric strings.
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
 * Reference range: eGFR < 60 mL/min/1.73m2 is considered below reference.
 */
const REFERENCE_RANGE_LOWER_LIMIT = 60;
const referenceRangeLowerLimit = () => REFERENCE_RANGE_LOWER_LIMIT;
const referenceRangeUpperLimit = () => undefined;
/**
 * Get eGFR result from RS CDF (baseline wave).
 */
const egfrResult = (wave) => {
    const val = (0, functionsCatalog_1.inputValue)('GFR', wave);
    return parseNumeric(val);
};
/**
 * True if eGFR is below the reference range (CKD threshold).
 */
const isEGFRBelowReferenceRange = (wave) => {
    const val = egfrResult(wave);
    if (val === undefined)
        return undefined;
    return val < referenceRangeLowerLimit();
};
/**
 * Result flag if eGFR below reference; undefined otherwise.
 * Uses same SNOMED flag “Below reference range” as other labs.
 */
const resultFlags = (wave) => {
    const below = isEGFRBelowReferenceRange(wave);
    if (below === true) {
        // below_reference_range
        return (0, codesCollection_1.getSNOMEDCode)('281300000');
    }
    return undefined;
};
/**
 * Collection date: baseline exam date from date_int_cen.a1.
 */
const collectedDateTime = (wave) => {
    const date = (0, functionsCatalog_1.inputValue)('date_int_cen', wave);
    (0, unexpectedInputException_1.assertIsDefined)(date, `Precondition failed - eGFR: missing date_int_cen in assessment ${wave}`);
    return rsDateToISO(date);
};
/**
 * Consider the assessment missed when eGFR is not available.
 */
const assessmentMissed = (wave) => {
    return egfrResult(wave) === undefined;
};
/**
 * Main export: conforms to LaboratoryTestResult so we can reuse
 * generic LabTestResult JSONata templates.
 */
exports.eGFR = {
    referenceRangeUpperLimit: function () {
        return referenceRangeUpperLimit();
    },
    referenceRangeLowerLimit: function () {
        return referenceRangeLowerLimit();
    },
    results: function () {
        const waves = ['a1']; // Rotterdam baseline wave
        return waves
            .filter((wave) => !assessmentMissed(wave))
            .map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            assessment: wave,
            resultFlags: resultFlags(wave),
            testResult: egfrResult(wave),
            collectedDateTime: collectedDateTime(wave),
        }));
    },
    diagnosticCategoryCoding: function () {
        // laboratory_report, kidney function test (example categories)
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('167171005')];
    },
    diagnosticCodeCoding: function () {
        // eGFR (CKD-EPI) serum/plasma (typical LOINC; keep consistent with Lifelines)
        return [(0, codesCollection_1.getLOINCCode)('33914-3')];
    },
    diagnosticCodeText: function () {
        return 'Glomerular filtration rate/1.73 sq M.predicted';
    },
    observationCategoryCoding: function () {
        // Laboratory test finding / Serum chemistry test etc.
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        return [(0, codesCollection_1.getLOINCCode)('33914-3')];
    },
    resultUnit: function () {
        // mL/min/{1.73_m2}
        return (0, codesCollection_1.getUCUMCode)('mL/min/{1.73_m2}');
    },
    labTestName: function () {
        return 'egfr';
    },
};
//# sourceMappingURL=eGFR.js.map
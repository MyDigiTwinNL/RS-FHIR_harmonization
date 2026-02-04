"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatinine = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Rotterdam Study – Creatinine pairing rules
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   creat_umol.a1      Creatinine in µmol/L
 *   sex_mapped.a1      "male" / "female"
 *   date_int_cen.a1    Baseline exam date (DD-MM-YYYY)
 *
 * Same coding as Lifelines:
 *   LOINC 14682-9  "Creat SerPl-sCnc"
 *   UCUM  umol/L
 *   SNOMED result flags:
 *     281302008  Above reference range
 *     281300000  Below reference range
 */
exports.creatinine = {
    labTestName: function () {
        return 'creatinine';
    },
    referenceRangeUpperLimit: function () {
        // We only encode thresholds in resultFlags; no fixed RR in the resource.
        return undefined;
    },
    referenceRangeLowerLimit: function () {
        return undefined;
    },
    diagnosticCategoryCoding: function () {
        // laboratory_report, microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        // "Creat SerPl-sCnc"
        return [(0, codesCollection_1.getLOINCCode)('14682-9')];
    },
    diagnosticCodeText: function () {
        return 'Creatinine [Moles/Vol] in Serum or Plasma';
    },
    observationCategoryCoding: function () {
        // Laboratory test finding, Serum chemistry test
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        return [(0, codesCollection_1.getLOINCCode)('14682-9')];
    },
    resultUnit: function () {
        // µmol/L
        return (0, codesCollection_1.getUCUMCode)('umol/L');
    },
    results: function () {
        const waves = ['a1']; // Rotterdam baseline wave
        return waves
            .filter((wave) => !assessmentMissed(wave))
            .map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            assessment: wave,
            resultFlags: resultFlags(wave),
            testResult: creatinineResult(wave),
            collectedDateTime: collectedDateTime(wave),
        }));
    },
};
/**
 * Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD.
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
 * Creatinine value (µmol/L) from RS CDF.
 */
const creatinineResult = (wave) => {
    const val = (0, functionsCatalog_1.inputValue)('creat_umol', wave);
    return parseNumeric(val);
};
/**
 * Assessment is missed if creatinine is missing.
 */
const assessmentMissed = (wave) => {
    return creatinineResult(wave) === undefined;
};
/**
 * Collection date = baseline exam date.
 */
const collectedDateTime = (wave) => {
    const date = (0, functionsCatalog_1.inputValue)('date_int_cen', wave);
    (0, unexpectedInputException_1.assertIsDefined)(date, `Precondition failed - creatinine: missing date_int_cen in assessment ${wave}`);
    return rsDateToISO(date);
};
/**
 * Result flag based on gender-specific reference ranges.
 *
 * Thresholds (as in Lifelines comments, µmol/L):
 *
 *   If male:
 *     >110  → Above reference range (281302008)
 *     <50   → Below reference range (281300000)
 *   If female:
 *     >90   → Above reference range (281302008)
 *     <50   → Below reference range (281300000)
 */
const resultFlags = (wave) => {
    const creat = creatinineResult(wave);
    if (creat === undefined)
        return undefined;
    const sex = (0, functionsCatalog_1.inputValue)('sex_mapped', wave)?.toLowerCase();
    if (sex === 'male') {
        if (creat > 110) {
            return (0, codesCollection_1.getSNOMEDCode)('281302008'); // above_reference_range
        }
        else if (creat < 50) {
            return (0, codesCollection_1.getSNOMEDCode)('281300000'); // below_reference_range
        }
        else {
            return undefined;
        }
    }
    else if (sex === 'female') {
        if (creat > 90) {
            return (0, codesCollection_1.getSNOMEDCode)('281302008');
        }
        else if (creat < 50) {
            return (0, codesCollection_1.getSNOMEDCode)('281300000');
        }
        else {
            return undefined;
        }
    }
    else {
        // Unknown sex → no flag
        return undefined;
    }
};
//# sourceMappingURL=Creatinine.js.map
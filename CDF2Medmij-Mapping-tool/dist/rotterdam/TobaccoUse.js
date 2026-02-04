"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.results = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD.
 * (We don’t actually use the date in the ZIB profile here, but keep helper for
 * potential extensions.)
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
 * Check if a given assessment was missed.
 * We follow the Lifelines convention: if the main exam date is missing for
 * that assessment, we assume it was not performed.
 */
const missedAssessment = (wave) => (0, functionsCatalog_1.inputValue)('date_int_cen', wave) === undefined;
/**
 * Check if we’re missing essential smoking-status data.
 * For RS, that’s when smoking_status is missing.
 */
const essentialDataMissed = (wave) => (0, functionsCatalog_1.inputValue)('smoking_status', wave) === undefined;
/**
 * Main export used by the TobaccoUse JSONata templates.
 * For Rotterdam we only have baseline wave "a1".
 */
const results = function () {
    const waves = ['a1'];
    return waves
        .filter((wave) => !missedAssessment(wave) && !essentialDataMissed(wave))
        .map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
        assessment: wave,
        useStatus: tobaccoUseStatus(wave),
        amountPerDay: amountPerDay(wave),
        packYears: packYears(wave),
        smokingStartDate: smokingStart(wave),
        smokingEndDate: smokingEnd(wave),
        everSmoker: everSmoker(wave),
        exSmoker: exSmoker(wave),
    }));
};
exports.results = results;
/**
 * Map RS smoking_status → SNOMED useStatus.
 *
 * Expected values (case-insensitive):
 *   "never"   → non_smoker
 *   "former"  → ex_smoker
 *   "current" → daily
 * Anything else → other
 */
const tobaccoUseStatus = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('smoking_status', wave);
    (0, unexpectedInputException_1.assertIsDefined)(raw, 'Expected non-null value for smoking_status');
    const status = raw.toLowerCase().trim();
    if (status === 'never') {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.non_smoker;
    }
    else if (status === 'former' || status === 'ex' || status === 'ex-smoker') {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.ex_smoker;
    }
    else if (status === 'current') {
        // Daily smoker is the closest SNOMED concept in the existing list
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.daily;
    }
    else {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.other;
    }
};
/**
 * Ever smoker flag derived from smoking_status.
 */
const everSmoker = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('smoking_status', wave);
    (0, unexpectedInputException_1.assertIsDefined)(raw, 'Expected non-null value for smoking_status');
    const status = raw.toLowerCase().trim();
    // Never → false; anything else (former/current/other) → true
    return status !== 'never';
};
/**
 * Ex-smoker flag derived from smoking_status.
 */
const exSmoker = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('smoking_status', wave);
    (0, unexpectedInputException_1.assertIsDefined)(raw, 'Expected non-null value for smoking_status');
    const status = raw.toLowerCase().trim();
    return status === 'former' || status === 'ex' || status === 'ex-smoker';
};
/**
 * Amount per day is not available in Rotterdam Study; always undefined.
 */
const amountPerDay = (wave) => {
    return undefined;
};
/**
 * Pack-years are not available in Rotterdam Study; always undefined.
 */
const packYears = (wave) => {
    return undefined;
};
/**
 * Smoking start date not available; always undefined.
 */
const smokingStart = (wave) => {
    return undefined;
};
/**
 * Smoking end date not available; always undefined.
 */
const smokingEnd = (wave) => {
    return undefined;
};
/**
 * Type of tobacco is not available in RS; keep it undefined (as in Lifelines).
 */
const typeOfTobaccoUsed = (wave) => {
    return undefined;
};
//# sourceMappingURL=TobaccoUse.js.map
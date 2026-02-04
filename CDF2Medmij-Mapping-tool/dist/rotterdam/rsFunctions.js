"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsHasValue = exports.rsNumberValue = exports.rsResourceId = exports.rsDeathDate = exports.rsBaselineDate = exports.rsDateToISO = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
/**
 * Rotterdam Study–specific helper functions.
 *
 * All RS dates in the CDF are stored as DD-MM-YYYY strings (e.g. "29-02-2000").
 * FHIR requires ISO 8601 (YYYY-MM-DD), so we convert consistently here.
 *
 * All helpers assume a single baseline wave "a1" in the RS CDF.
 */
/**
 * Convert a DD-MM-YYYY date string (as used in Rotterdam Study CDF)
 * into an ISO 8601 date string (YYYY-MM-DD).
 *
 * Returns undefined if the input is empty, malformed, or undefined.
 */
const rsDateToISO = (ddmmyyyy) => {
    if (!ddmmyyyy)
        return undefined;
    const trimmed = ddmmyyyy.trim();
    if (trimmed === '')
        return undefined;
    const parts = trimmed.split('-');
    if (parts.length !== 3)
        return undefined;
    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!Number.isInteger(day) ||
        !Number.isInteger(month) ||
        !Number.isInteger(year) ||
        day <= 0 ||
        month <= 0 ||
        month > 12) {
        return undefined;
    }
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${mm}-${dd}`;
};
exports.rsDateToISO = rsDateToISO;
/**
 * Baseline interview date as ISO string (YYYY-MM-DD).
 *
 * Source: date_int_cen.a1 (DD-MM-YYYY)
 */
const rsBaselineDate = () => (0, exports.rsDateToISO)((0, functionsCatalog_1.inputValue)('date_int_cen', 'a1'));
exports.rsBaselineDate = rsBaselineDate;
/**
 * Date of death, if available, as ISO string (YYYY-MM-DD).
 *
 * Typical source in RS CDF: fp_mortdat.a1 (DD-MM-YYYY)
 * If your CDF uses a different variable name, update it here.
 */
const rsDeathDate = () => (0, exports.rsDateToISO)((0, functionsCatalog_1.inputValue)('fp_mortdat', 'a1'));
exports.rsDeathDate = rsDeathDate;
/**
 * Stable resource ID for a given resource type, based on PROJECT_PSEUDO_ID.
 *
 * Example output: "Patient-1", "heart-failure-1"
 *
 * Uses PROJECT_PSEUDO_ID.a1 because that field is populated in the RS CDF.
 */
const rsResourceId = (resourceName) => {
    const pid = (0, functionsCatalog_1.inputValue)('PROJECT_PSEUDO_ID', 'a1')?.trim() ||
        (0, functionsCatalog_1.inputValue)('project_pseudo_id', 'a1')?.trim() ||
        'UNKNOWN';
    return `${resourceName}-${pid}`;
};
exports.rsResourceId = rsResourceId;
/**
 * Convenience: numeric value helper.
 *
 * Reads a variable at wave "a1" and returns a number if possible,
 * or undefined if the value is missing or not numeric.
 */
const rsNumberValue = (varName) => {
    const raw = (0, functionsCatalog_1.inputValue)(varName, 'a1');
    if (!raw)
        return undefined;
    const trimmed = raw.trim();
    if (trimmed === '')
        return undefined;
    const n = Number(trimmed);
    return Number.isNaN(n) ? undefined : n;
};
exports.rsNumberValue = rsNumberValue;
/**
 * Convenience: check if a variable at wave "a1" has a non-empty value.
 */
const rsHasValue = (varName) => {
    const raw = (0, functionsCatalog_1.inputValue)(varName, 'a1');
    return !!raw && raw.trim() !== '';
};
exports.rsHasValue = rsHasValue;
//# sourceMappingURL=rsFunctions.js.map
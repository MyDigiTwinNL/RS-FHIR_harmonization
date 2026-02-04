"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectedDateTime = exports.arterialBloodPressure = exports.diastolicBloodPressure = exports.systolicBloodPressure = exports.measuringLocation = exports.cuffType = exports.results = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Simple DD-MM-YYYY → YYYY-MM-DD converter for Rotterdam Study dates.
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
 * Helper to safely parse numeric strings, returning undefined for empty/missing.
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
 * For Rotterdam Study we have a single baseline “wave” a1.
 * If either SBP or DBP is missing, consider the assessment missed.
 */
const missedAssessment = (wave) => {
    const sbp = (0, functionsCatalog_1.inputValue)('sbp', wave);
    const dbp = (0, functionsCatalog_1.inputValue)('dbp', wave);
    return sbp === undefined || sbp.trim() === '' || dbp === undefined || dbp.trim() === '';
};
/**
 * Main entry point used by the BloodPressure JSONata templates.
 * Returns at most one baseline blood pressure reading for wave "a1".
 */
const results = function () {
    const waves = ['a1'];
    return waves
        .filter((wave) => !missedAssessment(wave))
        .map((wave) => 
    // Use a checked proxy to catch typos / missing properties in JSONata templates.
    (0, functionsCatalog_1.createCheckedAccessProxy)({
        assessment: wave,
        cuffType: (0, exports.cuffType)(wave),
        measuringLocation: (0, exports.measuringLocation)(wave),
        systolicBloodPressure: (0, exports.systolicBloodPressure)(wave),
        diastolicBloodPressure: (0, exports.diastolicBloodPressure)(wave),
        arterialBloodPressure: (0, exports.arterialBloodPressure)(wave),
        collectedDateTime: (0, exports.collectedDateTime)(wave),
    }));
};
exports.results = results;
/**
 * RS CDF does not contain cuff type; leave undefined.
 */
const cuffType = (wave) => {
    return undefined;
};
exports.cuffType = cuffType;
/**
 * RS CDF does not contain arm/location; leave undefined.
 */
const measuringLocation = (wave) => {
    return undefined;
};
exports.measuringLocation = measuringLocation;
/**
 * Systolic blood pressure from sbp.a1 (mmHg).
 */
const systolicBloodPressure = (wave) => {
    return parseNumeric((0, functionsCatalog_1.inputValue)('sbp', wave));
};
exports.systolicBloodPressure = systolicBloodPressure;
/**
 * Diastolic blood pressure from dbp.a1 (mmHg).
 */
const diastolicBloodPressure = (wave) => {
    return parseNumeric((0, functionsCatalog_1.inputValue)('dbp', wave));
};
exports.diastolicBloodPressure = diastolicBloodPressure;
/**
 * Mean arterial pressure computed as:
 *   MAP = DBP + (SBP - DBP) / 3
 * Only computed when both SBP and DBP are available.
 */
const arterialBloodPressure = (wave) => {
    const sbp = (0, exports.systolicBloodPressure)(wave);
    const dbp = (0, exports.diastolicBloodPressure)(wave);
    if (sbp === undefined || dbp === undefined)
        return undefined;
    return dbp + (sbp - dbp) / 3;
};
exports.arterialBloodPressure = arterialBloodPressure;
/**
 * Collection date/time: use baseline examination date (date_int_cen.a1).
 */
const collectedDateTime = (wave) => {
    const date = (0, functionsCatalog_1.inputValue)('date_int_cen', wave);
    (0, unexpectedInputException_1.assertIsDefined)(date, `Precondition failed - bloodpressure: missing date_int_cen in assessment ${wave}`);
    return rsDateToISO(date);
};
exports.collectedDateTime = collectedDateTime;
//# sourceMappingURL=BloodPressure.js.map
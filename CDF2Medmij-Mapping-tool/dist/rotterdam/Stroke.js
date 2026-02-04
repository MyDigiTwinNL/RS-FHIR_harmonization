"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stroke = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
/**
 * Rotterdam Study – Stroke condition
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   incident_stroke_bool.a1          "True" / "False"
 *   incident_stroke_date_derived.a1  date of first incident stroke (DD-MM-YYYY)
 *
 * Different from Lifelines:
 *   - No self-reported follow-up waves
 *   - No midpoint imputation: we use the actual event date from the registry
 */
const WAVE = 'a1';
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
 * Helper: does this participant have an incident stroke?
 */
const hasIncidentStroke = (wave) => {
    const flag = (0, functionsCatalog_1.inputValue)('incident_stroke_bool', wave);
    return flag === 'True' || flag === 'true' || flag === '1';
};
/**
 * Helper: event date for the first incident stroke, if any.
 */
const incidentStrokeDate = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('incident_stroke_date_derived', wave);
    if (!raw || raw.trim() === '')
        return undefined;
    return rsDateToISO(raw);
};
exports.stroke = {
    conditionName: function () {
        return 'stroke';
    },
    /**
     * Present if there is an incident stroke.
     */
    isPresent: function () {
        return hasIncidentStroke(WAVE);
    },
    /**
     * Clinical status: use "active" when there is an incident stroke,
     * otherwise undefined (no Condition should be emitted when !isPresent).
     *
     * SNOMED 55561003 – Active
     */
    clinicalStatus: function () {
        if (!hasIncidentStroke(WAVE))
            return undefined;
        return (0, codesCollection_1.getSNOMEDCode)('55561003');
    },
    /**
     * Verification status. Lifelines used an "unknown" placeholder;
     * we keep the same behaviour for consistency.
     */
    verificationStatus: function () {
        // "UNK" is the placeholder key used in the original Stroke.ts
        return (0, codesCollection_1.getSNOMEDCode)('UNK');
    },
    /**
     * SNOMED code for cerebrovascular accident:
     *   230690007 – Cerebrovascular accident (disorder)
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)('230690007');
    },
    /**
     * Onset date of the stroke:
     *   - Directly use the registry-linked event date from
     *     incident_stroke_date_derived.a1
     *   - No midpoint imputation or self-report based pairing rule.
     */
    onsetDateTime: function () {
        if (!hasIncidentStroke(WAVE))
            return undefined;
        return incidentStrokeDate(WAVE);
    },
};
//# sourceMappingURL=Stroke.js.map
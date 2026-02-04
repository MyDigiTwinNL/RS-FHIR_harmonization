"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myocardialInfarction = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
/**
 * Rotterdam Study – Myocardial Infarction (MI) condition
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   incident_mi_bool.a1            "True" / "False" / "1" / "0"
 *   incident_mi_date_derived.a1    date of first incident MI (DD-MM-YYYY)
 *
 * Different from Lifelines:
 *   - Outcomes come from registry linkage (ICD-based), not self-report.
 *   - We have the actual event date → no midpoint imputation or complex pairing rule.
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
 * Helper: does this participant have an incident myocardial infarction?
 */
const hasIncidentMI = (wave) => {
    const flag = (0, functionsCatalog_1.inputValue)('incident_mi_bool', wave);
    if (flag === undefined)
        return false;
    const norm = flag.toString().toLowerCase().trim();
    return norm === 'true' || norm === '1' || norm === 'yes';
};
/**
 * Helper: event date for the first incident MI, if any.
 */
const incidentMIDate = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('incident_mi_date_derived', wave);
    if (!raw || raw.trim() === '')
        return undefined;
    return rsDateToISO(raw);
};
exports.myocardialInfarction = {
    conditionName: function () {
        // Keep the same name as the Lifelines module so templates stay compatible
        return 'MI';
    },
    /**
     * The condition is present if there is an incident MI.
     */
    isPresent: function () {
        return hasIncidentMI(WAVE);
    },
    /**
     * Clinical status: "active" when there is an incident MI.
     *
     * SNOMED 55561003 – Active
     */
    clinicalStatus: function () {
        if (!hasIncidentMI(WAVE))
            return undefined;
        return (0, codesCollection_1.getSNOMEDCode)('55561003');
    },
    /**
     * Verification status: keep the same "unknown" code as the Lifelines
     * implementation, so downstream logic stays identical.
     */
    verificationStatus: function () {
        // "UNK" placeholder code as used in the original MyocardialInfarction.ts
        return (0, codesCollection_1.getSNOMEDCode)('UNK');
    },
    /**
     * SNOMED code for myocardial infarction:
     *   22298006 – Myocardial infarction (disorder)
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)('22298006');
    },
    /**
     * Onset date of the myocardial infarction:
     *   - Directly use the registry-linked event date from
     *     incident_mi_date_derived.a1
     *   - No midpoint imputation, no self-report follow-up logic.
     */
    onsetDateTime: function () {
        if (!hasIncidentMI(WAVE))
            return undefined;
        return incidentMIDate(WAVE);
    },
};
//# sourceMappingURL=MyocardialInfarction.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardioVascularDisease = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
/**
 * Rotterdam Study – Composite Cardiovascular Disease (CVD)
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   incident_cvd_composite_bool.a1     "True" / "False" / "1" / "0"
 *   incident_cvd_date_derived.a1       earliest of MI / Stroke / HF (DD-MM-YYYY)
 *
 * Notes:
 *   - RS is registry-linked → true diagnosis dates → no midpoint imputation.
 *   - We rely on your preprocessing script to derive the composite fields.
 */
const WAVE = 'a1';
/**
 * Convert DD-MM-YYYY → YYYY-MM-DD for FHIR.
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
 * Whether RS participant has composite incident CVD.
 */
const hasIncidentCVD = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('incident_cvd_composite_bool', wave);
    if (raw === undefined)
        return false;
    const norm = raw.toString().toLowerCase().trim();
    return norm === 'true' || norm === '1' || norm === 'yes';
};
/**
 * Earliest event date among MI, Stroke, HF (derived beforehand).
 */
const incidentCVDDate = (wave) => {
    if (!hasIncidentCVD(wave))
        return undefined;
    const raw = (0, functionsCatalog_1.inputValue)('incident_cvd_date_derived', wave);
    if (!raw || raw.trim() === '')
        return undefined;
    return rsDateToISO(raw);
};
exports.cardioVascularDisease = {
    /**
     * Name expected by generic Condition.jsonata template.
     */
    conditionName: function () {
        return 'composite-cvd';
    },
    /**
     * Composite CVD is present if any component outcome is present.
     */
    isPresent: function () {
        return hasIncidentCVD(WAVE);
    },
    /**
     * Clinical status → active when condition is present.
     *
     * SNOMED: 55561003 — "active"
     */
    clinicalStatus: function () {
        if (!hasIncidentCVD(WAVE))
            return undefined;
        return (0, codesCollection_1.getSNOMEDCode)('55561003');
    },
    /**
     * Verification status → keep the Lifelines "unknown" code.
     */
    verificationStatus: function () {
        return (0, codesCollection_1.getSNOMEDCode)('UNK');
    },
    /**
     * SNOMED code for cardiovascular disease (composite):
     *
     *   49601007 — Cardiovascular disease (disorder)
     *
     * This is the standard code used internationally for composite CVD endpoints.
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)('49601007');
    },
    /**
     * Onset = earliest actual event date.
     * No midpoint imputation needed.
     */
    onsetDateTime: function () {
        return incidentCVDDate(WAVE);
    },
};
//# sourceMappingURL=CardioVascularDisease.js.map
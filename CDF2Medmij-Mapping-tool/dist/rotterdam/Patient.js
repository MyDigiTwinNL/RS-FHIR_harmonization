"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gender = exports.deceasedDateTime = exports.birthDate = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const fhirv3codes_1 = require("../codes/fhirv3codes");
const unexpectedInputException_1 = require("../unexpectedInputException");
/*
 * Rotterdam Study – Patient core demographics
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   gebdatum.a1      Date of birth (DD-MM-YYYY)
 *   fp_mortdat.a1    Date of death (DD-MM-YYYY), empty if alive
 *   sexe.a1          Sex code (assumed 1 = male, 2 = female)
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
 * Patient.birthDate
 * Uses gebdatum.a1 (DD-MM-YYYY) → YYYY-MM-DD.
 */
const birthDate = () => {
    const raw = (0, functionsCatalog_1.inputValue)('gebdatum', WAVE);
    (0, unexpectedInputException_1.assertIsDefined)(raw, 'Expected non-null value for gebdatum');
    const trimmed = raw.trim();
    if (trimmed === '') {
        return undefined;
    }
    return rsDateToISO(trimmed);
};
exports.birthDate = birthDate;
/**
 * Patient.deceasedDateTime
 * Uses fp_mortdat.a1 if non-empty; otherwise undefined (alive / unknown).
 */
const deceasedDateTime = () => {
    const raw = (0, functionsCatalog_1.inputValue)('fp_mortdat', WAVE);
    if (raw === undefined)
        return undefined;
    const trimmed = raw.trim();
    if (trimmed === '') {
        // no recorded date of death → treat as not deceased / unknown
        return undefined;
    }
    return rsDateToISO(trimmed);
};
exports.deceasedDateTime = deceasedDateTime;
/**
 * Patient.gender
 *
 * RS CDF uses sexe.a1:
 *   1 → male
 *   2 → female
 *
 * If the encoding differs (e.g. "MALE"/"FEMALE"), we also try to map those.
 */
const gender = () => {
    const raw = (0, functionsCatalog_1.inputValue)('sexe', WAVE);
    if (raw === undefined)
        return undefined;
    const trimmed = raw.toString().trim().toUpperCase();
    // numeric codes used in many RS datasets
    if (trimmed === '1') {
        return fhirv3codes_1.genderFHIRV3Codes.male;
    }
    if (trimmed === '2') {
        return fhirv3codes_1.genderFHIRV3Codes.female;
    }
    // fall back to textual values if present
    if (trimmed === 'MALE') {
        return fhirv3codes_1.genderFHIRV3Codes.male;
    }
    if (trimmed === 'FEMALE') {
        return fhirv3codes_1.genderFHIRV3Codes.female;
    }
    // anything else → undefined (unknown gender)
    return undefined;
};
exports.gender = gender;
//# sourceMappingURL=Patient.js.map
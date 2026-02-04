"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotterdamFunctions = exports.waveSpecificResourceId = exports.resourceId = exports.rsBool = exports.rsNumeric = exports.rsDateToISO = void 0;
const functionsCatalog_1 = require("./functionsCatalog");
/**
 * Rotterdam Study helper functions
 *
 * These replace lifelinesFunctions.ts for modules under src/rotterdam.
 * They are deliberately minimal: only what RS needs.
 */
/** Convert DD-MM-YYYY → YYYY-MM-DD */
const rsDateToISO = (ddmmyyyy) => {
    if (!ddmmyyyy)
        return undefined;
    const p = ddmmyyyy.split('-');
    if (p.length !== 3)
        return undefined;
    const [d, m, y] = p.map(Number);
    if (!d || !m || !y)
        return undefined;
    return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
};
exports.rsDateToISO = rsDateToISO;
/** Safe numeric reader */
const rsNumeric = (val) => {
    if (!val)
        return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
};
exports.rsNumeric = rsNumeric;
/** Boolean flag parser */
const rsBool = (val) => {
    if (!val)
        return false;
    const norm = val.toLowerCase().trim();
    return norm === '1' || norm === 'true' || norm === 'yes';
};
exports.rsBool = rsBool;
/** Participant ID for RS (always wave a1) */
const rsParticipantId = () => {
    const v = (0, functionsCatalog_1.inputValue)('project_pseudo_id', 'a1');
    if (!v)
        throw new Error(`Missing project_pseudo_id.a1`);
    return v;
};
/** Resource ID (no wave) */
const resourceId = (resourceName) => {
    return `${resourceName}-${rsParticipantId()}`;
};
exports.resourceId = resourceId;
/** Resource ID with wave */
const waveSpecificResourceId = (resourceName, wave) => {
    return `${resourceName}-${wave}-${rsParticipantId()}`;
};
exports.waveSpecificResourceId = waveSpecificResourceId;
/** Export as namespace-like object (optional convenience) */
exports.rotterdamFunctions = {
    rsDateToISO: exports.rsDateToISO,
    rsNumeric: exports.rsNumeric,
    rsBool: exports.rsBool,
    resourceId: exports.resourceId,
    waveSpecificResourceId: exports.waveSpecificResourceId,
};
//# sourceMappingURL=lifelinesFunctions_rotterdam.js.map
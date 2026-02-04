"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onsetDateTime = exports.code = exports.verificationStatus = exports.clinicalStatus = exports.isPresent = exports.conditionName = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
/**
 * Rotterdam Study – Hypertension
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   prev_HT.a1       "0"/"1" (numeric prevalent HT)
 *   prev_HT_bool.a1  "True"/"False" (boolean prevalent HT)
 *
 * We only model *prevalent* hypertension at baseline.
 * No incident HT, no midpoint imputation.
 */
const WAVE = 'a1';
/**
 * True if the participant has prevalent hypertension at baseline.
 *
 * Priority:
 *   1) prev_HT_bool.a1  ("True"/"False"/"1"/"0"/"Yes"/"No")
 *   2) prev_HT.a1       (numeric "1" or "0")
 */
const hasHypertension = (wave) => {
    const boolFlag = (0, functionsCatalog_1.inputValue)('prev_HT_bool', wave);
    if (boolFlag !== undefined && boolFlag.trim() !== '') {
        const norm = boolFlag.toString().toLowerCase().trim();
        if (norm === 'true' || norm === '1' || norm === 'yes')
            return true;
        if (norm === 'false' || norm === '0' || norm === 'no')
            return false;
        // if weird value, fall through to numeric flag
    }
    const numFlag = (0, functionsCatalog_1.inputValue)('prev_HT', wave);
    if (numFlag === undefined || numFlag.toString().trim() === '')
        return false;
    return numFlag.toString().trim() === '1';
};
/**
 * Name used in the Hypertension.jsonata template.
 */
const conditionName = () => 'hypertension';
exports.conditionName = conditionName;
/**
 * Include in bundle only if hypertension is present.
 */
const isPresent = () => hasHypertension(WAVE);
exports.isPresent = isPresent;
/**
 * Clinical status:
 *   active if hypertension present, otherwise empty object.
 */
const clinicalStatus = () => {
    if (hasHypertension(WAVE)) {
        return snomedCodeLists_1.clinicalStatusSNOMEDCodeList.active;
    }
    else {
        return {};
    }
};
exports.clinicalStatus = clinicalStatus;
/**
 * Verification status:
 *   keep same pattern as Lifelines (unknown).
 */
const verificationStatus = () => {
    // Note: "unknwon" is the key used in Lifelines snomedCodeLists.
    return snomedCodeLists_1.verificationStatusSNOMEDCodeList.unknwon;
};
exports.verificationStatus = verificationStatus;
/**
 * Condition code:
 *   systemic arterial hypertensive disorder.
 */
const code = () => snomedCodeLists_1.conditionsSNOMEDCodeList.hypertensive_disorder;
exports.code = code;
/**
 * Onset date:
 *   For RS we only know prevalent HT at baseline, not a precise onset date,
 *   so we leave this undefined.
 *
 * If in the future you derive a hypertension onset date in the CDF
 * (e.g. hypertension_date_derived), you can plug it in here with a
 * DD-MM-YYYY → YYYY-MM-DD converter.
 */
const onsetDateTime = () => {
    return undefined;
};
exports.onsetDateTime = onsetDateTime;
//# sourceMappingURL=Hypertension.js.map
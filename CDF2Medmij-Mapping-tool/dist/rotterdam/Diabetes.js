"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diabetes = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
/**
 * Rotterdam Study – Diabetes condition (prevalent at baseline)
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   prev_DM_bool.a1   "True"/"False", "1"/"0", or similar
 *   prev_DM_type.a1   (optional) diabetes type coding:
 *                     - free text or numeric; we only use it heuristically
 *
 * Important differences vs Lifelines:
 *   - We treat diabetes as a *prevalent* condition at baseline.
 *   - No follow-up waves, no self-report logic, no midpoint imputation.
 *   - Onset date is unknown → omitted (undefined).
 */
const WAVE = 'a1';
/**
 * Helper: does the participant have prevalent diabetes at baseline?
 */
const hasPrevalentDiabetes = (wave) => {
    const raw = (0, functionsCatalog_1.inputValue)('prev_DM_bool', wave);
    if (raw === undefined)
        return false;
    const norm = raw.toString().toLowerCase().trim();
    return norm === 'true' || norm === '1' || norm === 'yes';
};
/**
 * Determine SNOMED code for diabetes type.
 *
 * We mirror the Lifelines choices where we can:
 *   - 44054006 → Type 2 diabetes mellitus
 *   - 73211009 → Diabetes mellitus (disorder), unspecified type
 *
 * Because RS "prev_DM_type" coding is not standardized here, we use
 * simple heuristics. If we recognize type 2, we return the type 2 code;
 * otherwise we fall back to generic "diabetes mellitus".
 */
const determineDiabetesTypeCode = (wave) => {
    const rawType = (0, functionsCatalog_1.inputValue)('prev_DM_type', wave);
    if (rawType !== undefined) {
        const norm = rawType.toString().toLowerCase().trim();
        // Heuristic: if the value clearly refers to type 2, use the T2D code
        if (norm.includes('2') ||
            norm.includes('type2') ||
            norm.includes('type 2') ||
            norm.includes('t2')) {
            // Type 2 diabetes mellitus
            return (0, codesCollection_1.getSNOMEDCode)('44054006');
        }
    }
    // Fallback: unspecified diabetes mellitus
    // (Same code as in Lifelines: issue-comment reference in their TS)
    return (0, codesCollection_1.getSNOMEDCode)('73211009');
};
exports.diabetes = {
    conditionName: function () {
        return 'diabetes';
    },
    /**
     * Present if prevalent diabetes flag is true at baseline.
     */
    isPresent: function () {
        return hasPrevalentDiabetes(WAVE);
    },
    /**
     * Clinical status:
     *   - "active" (55561003) when diabetes is present
     *   - undefined otherwise (no Condition will be created when !isPresent)
     */
    clinicalStatus: function () {
        if (!hasPrevalentDiabetes(WAVE))
            return undefined;
        return (0, codesCollection_1.getSNOMEDCode)('55561003');
    },
    /**
     * Verification status:
     *   For compatibility with Lifelines Conditions, we keep the same
     *   "unknown" placeholder code used elsewhere ("UNK").
     */
    verificationStatus: function () {
        return (0, codesCollection_1.getSNOMEDCode)('UNK');
    },
    /**
     * Condition code:
     *   - Type 2 DM when we can recognize it from prev_DM_type
     *   - Otherwise generic "diabetes mellitus (disorder)".
     */
    code: function () {
        return determineDiabetesTypeCode(WAVE);
    },
    /**
     * Onset date:
     *   We do not have a reliable onset date in the RS CDF, only prevalence
     *   at baseline, so we leave this undefined.
     *
     *   If later you add a derived "prev_DM_onset_date_derived" to your CDF,
     *   you can plug it in here via a DD-MM-YYYY → ISO converter.
     */
    onsetDateTime: function () {
        return undefined;
    },
};
//# sourceMappingURL=Diabetes.js.map
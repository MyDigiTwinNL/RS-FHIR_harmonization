import { inputValue } from '../functionsCatalog';
import { Condition } from '../fhir-resource-interfaces/condition';
import { getSNOMEDCode, CodeProperties } from '../codes/codesCollection';

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

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

/**
 * Helper: does the participant have prevalent diabetes at baseline?
 */
const hasPrevalentDiabetes = (wave: string): boolean => {
  const raw = inputValue('prev_DM_bool', wave);
  if (raw === undefined) return false;

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
const determineDiabetesTypeCode = (wave: string): CodeProperties => {
  const rawType = inputValue('prev_DM_type', wave);

  if (rawType !== undefined) {
    const norm = rawType.toString().toLowerCase().trim();

    // Heuristic: if the value clearly refers to type 2, use the T2D code
    if (
      norm.includes('2') ||
      norm.includes('type2') ||
      norm.includes('type 2') ||
      norm.includes('t2')
    ) {
      // Type 2 diabetes mellitus
      return getSNOMEDCode('44054006');
    }
  }

  // Fallback: unspecified diabetes mellitus
  // (Same code as in Lifelines when type cannot be determined)
  return getSNOMEDCode('73211009');
};

/* ------------------------------------------------------------------ */
/*  Exported functions – used directly by Condition.jsonata as $name() */
/* ------------------------------------------------------------------ */

/** Name of the condition, used in resource id construction. */
export function conditionName(): string {
  return 'diabetes';
}

/**
 * Present if prevalent diabetes flag is true at baseline.
 */
export function isPresent(): boolean {
  return hasPrevalentDiabetes(WAVE);
}

/**
 * Clinical status:
 *   - "active" (55561003) when diabetes is present
 *   - undefined otherwise (no Condition will be created when !isPresent)
 */
export function clinicalStatus(): CodeProperties | undefined {
  if (!hasPrevalentDiabetes(WAVE)) return undefined;
  return getSNOMEDCode('55561003'); // Active
}

/**
 * Verification status:
 *   For compatibility with Lifelines Conditions, we keep the same
 *   "unknown" placeholder code used elsewhere ("UNK").
 */
export function verificationStatus(): CodeProperties {
  return getSNOMEDCode('UNK');
}

/**
 * Condition code:
 *   - Type 2 DM when we can recognize it from prev_DM_type
 *   - Otherwise generic "diabetes mellitus (disorder)".
 */
export function code(): CodeProperties {
  return determineDiabetesTypeCode(WAVE);
}

/**
 * Onset date:
 *   We do not have a reliable onset date in the RS CDF, only prevalence
 *   at baseline, so we leave this undefined.
 *
 *   If later you add a derived "prev_DM_onset_date_derived" to your CDF,
 *   you can plug it in here via a DD-MM-YYYY → ISO converter.
 */
export function onsetDateTime(): string | undefined {
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Optional object export for typing / compatibility                  */
/*  (mapper only registers functions; JSONata uses the functions above)*/
/* ------------------------------------------------------------------ */

export const diabetes: Condition = {
  conditionName,
  isPresent,
  clinicalStatus,
  verificationStatus,
  code,
  onsetDateTime,
};

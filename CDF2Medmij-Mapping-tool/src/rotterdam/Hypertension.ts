import { inputValue } from '../functionsCatalog';
import {
  clinicalStatusSNOMEDCodeList,
  verificationStatusSNOMEDCodeList,
  conditionsSNOMEDCodeList,
} from '../codes/snomedCodeLists';

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
const hasHypertension = (wave: string): boolean => {
  const boolFlag = inputValue('prev_HT_bool', wave);
  if (boolFlag !== undefined && boolFlag.trim() !== '') {
    const norm = boolFlag.toString().toLowerCase().trim();
    if (norm === 'true' || norm === '1' || norm === 'yes') return true;
    if (norm === 'false' || norm === '0' || norm === 'no') return false;
    // if weird value, fall through to numeric flag
  }

  const numFlag = inputValue('prev_HT', wave);
  if (numFlag === undefined || numFlag.toString().trim() === '') return false;
  return numFlag.toString().trim() === '1';
};

/**
 * Name used in the Hypertension.jsonata template.
 */
export const conditionName = (): string => 'hypertension';

/**
 * Include in bundle only if hypertension is present.
 */
export const isPresent = (): boolean => hasHypertension(WAVE);

/**
 * Clinical status:
 *   active if hypertension present, otherwise empty object.
 */
export const clinicalStatus = (): object => {
  if (hasHypertension(WAVE)) {
    return clinicalStatusSNOMEDCodeList.active;
  } else {
    return {};
  }
};

/**
 * Verification status:
 *   keep same pattern as Lifelines (unknown).
 */
export const verificationStatus = (): object => {
  // Note: "unknwon" is the key used in Lifelines snomedCodeLists.
  return verificationStatusSNOMEDCodeList.unknwon;
};

/**
 * Condition code:
 *   systemic arterial hypertensive disorder.
 */
export const code = (): object => conditionsSNOMEDCodeList.hypertensive_disorder;

/**
 * Onset date:
 *   For RS we only know prevalent HT at baseline, not a precise onset date,
 *   so we leave this undefined.
 *
 * If in the future you derive a hypertension onset date in the CDF
 * (e.g. hypertension_date_derived), you can plug it in here with a
 * DD-MM-YYYY → YYYY-MM-DD converter.
 */
export const onsetDateTime = (): string | undefined => {
  return undefined;
};

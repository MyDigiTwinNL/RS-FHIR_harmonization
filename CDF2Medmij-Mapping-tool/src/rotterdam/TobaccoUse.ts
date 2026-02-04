import { inputValue, createCheckedAccessProxy } from '../functionsCatalog';
import {
  tobaccoUseStatusSNOMEDCodelist,
  typeOfTobaccoUsedSNOMEDCodelist,
} from '../codes/snomedCodeLists';
import { assertIsDefined } from '../unexpectedInputException';

/**
 * Rotterdam Study – Tobacco use pairing rules
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   smoking_status.a1   categorical status (e.g. "never", "former", "current")
 *   date_int_cen.a1     baseline exam date (DD-MM-YYYY)
 *
 * No smoking quantity, pack-years or start/end age variables are available,
 * so those fields are always left undefined.
 */

export type TobaccoUseProperties = {
  assessment: string;
  useStatus: object;
  amountPerDay: number | undefined;
  packYears: number | undefined;
  smokingStartDate: string | undefined;
  smokingEndDate: string | undefined;
  // mandatory for building the resource
  everSmoker: boolean;
  exSmoker: boolean;
};

/**
 * Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD.
 * (We don’t actually use the date in the ZIB profile here, but keep helper for
 * potential extensions.)
 */
const rsDateToISO = (ddmmyyyy: string | undefined): string | undefined => {
  if (!ddmmyyyy) return undefined;
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return undefined;

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (!day || !month || !year) return undefined;

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${mm}-${dd}`;
};

/**
 * Check if a given assessment was missed.
 * We follow the Lifelines convention: if the main exam date is missing for
 * that assessment, we assume it was not performed.
 */
const missedAssessment = (wave: string): boolean =>
  inputValue('date_int_cen', wave) === undefined;

/**
 * Check if we’re missing essential smoking-status data.
 * For RS, that’s when smoking_status is missing.
 */
const essentialDataMissed = (wave: string): boolean =>
  inputValue('smoking_status', wave) === undefined;

/**
 * Main export used by the TobaccoUse JSONata templates.
 * For Rotterdam we only have baseline wave "a1".
 */
export const results = function (): TobaccoUseProperties[] {
  const waves = ['a1'];

  return waves
    .filter((wave) => !missedAssessment(wave) && !essentialDataMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        useStatus: tobaccoUseStatus(wave),
        amountPerDay: amountPerDay(wave),
        packYears: packYears(wave),
        smokingStartDate: smokingStart(wave),
        smokingEndDate: smokingEnd(wave),
        everSmoker: everSmoker(wave),
        exSmoker: exSmoker(wave),
      })
    );
};

/**
 * Map RS smoking_status → SNOMED useStatus.
 *
 * Expected values (case-insensitive):
 *   "never"   → non_smoker
 *   "former"  → ex_smoker
 *   "current" → daily
 * Anything else → other
 */
const tobaccoUseStatus = (wave: string): object => {
  const raw = inputValue('smoking_status', wave);
  assertIsDefined(raw, 'Expected non-null value for smoking_status');

  const status = raw.toLowerCase().trim();

  if (status === 'never') {
    return tobaccoUseStatusSNOMEDCodelist.non_smoker;
  } else if (status === 'former' || status === 'ex' || status === 'ex-smoker') {
    return tobaccoUseStatusSNOMEDCodelist.ex_smoker;
  } else if (status === 'current') {
    // Daily smoker is the closest SNOMED concept in the existing list
    return tobaccoUseStatusSNOMEDCodelist.daily;
  } else {
    return tobaccoUseStatusSNOMEDCodelist.other;
  }
};

/**
 * Ever smoker flag derived from smoking_status.
 */
const everSmoker = (wave: string): boolean => {
  const raw = inputValue('smoking_status', wave);
  assertIsDefined(raw, 'Expected non-null value for smoking_status');
  const status = raw.toLowerCase().trim();

  // Never → false; anything else (former/current/other) → true
  return status !== 'never';
};

/**
 * Ex-smoker flag derived from smoking_status.
 */
const exSmoker = (wave: string): boolean => {
  const raw = inputValue('smoking_status', wave);
  assertIsDefined(raw, 'Expected non-null value for smoking_status');
  const status = raw.toLowerCase().trim();

  return status === 'former' || status === 'ex' || status === 'ex-smoker';
};

/**
 * Amount per day is not available in Rotterdam Study; always undefined.
 */
const amountPerDay = (wave: string): number | undefined => {
  return undefined;
};

/**
 * Pack-years are not available in Rotterdam Study; always undefined.
 */
const packYears = (wave: string): number | undefined => {
  return undefined;
};

/**
 * Smoking start date not available; always undefined.
 */
const smokingStart = (wave: string): string | undefined => {
  return undefined;
};

/**
 * Smoking end date not available; always undefined.
 */
const smokingEnd = (wave: string): string | undefined => {
  return undefined;
};

/**
 * Type of tobacco is not available in RS; keep it undefined (as in Lifelines).
 */
const typeOfTobaccoUsed = (wave: string): object | undefined => {
  return undefined;
};

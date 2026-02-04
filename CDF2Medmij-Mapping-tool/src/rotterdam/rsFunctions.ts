import { inputValue } from '../functionsCatalog';

/**
 * Rotterdam Study–specific helper functions.
 *
 * All RS dates in the CDF are stored as DD-MM-YYYY strings (e.g. "29-02-2000").
 * FHIR requires ISO 8601 (YYYY-MM-DD), so we convert consistently here.
 *
 * All helpers assume a single baseline wave "a1" in the RS CDF.
 */

/**
 * Convert a DD-MM-YYYY date string (as used in Rotterdam Study CDF)
 * into an ISO 8601 date string (YYYY-MM-DD).
 *
 * Returns undefined if the input is empty, malformed, or undefined.
 */
export const rsDateToISO = (ddmmyyyy: string | undefined): string | undefined => {
  if (!ddmmyyyy) return undefined;

  const trimmed = ddmmyyyy.trim();
  if (trimmed === '') return undefined;

  const parts = trimmed.split('-');
  if (parts.length !== 3) return undefined;

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    day <= 0 ||
    month <= 0 ||
    month > 12
  ) {
    return undefined;
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${mm}-${dd}`;
};

/**
 * Baseline interview date as ISO string (YYYY-MM-DD).
 *
 * Source: date_int_cen.a1 (DD-MM-YYYY)
 */
export const rsBaselineDate = (): string | undefined =>
  rsDateToISO(inputValue('date_int_cen', 'a1') as string | undefined);

/**
 * Date of death, if available, as ISO string (YYYY-MM-DD).
 *
 * Typical source in RS CDF: fp_mortdat.a1 (DD-MM-YYYY)
 * If your CDF uses a different variable name, update it here.
 */
export const rsDeathDate = (): string | undefined =>
  rsDateToISO(inputValue('fp_mortdat', 'a1') as string | undefined);

/**
 * Stable resource ID for a given resource type, based on PROJECT_PSEUDO_ID.
 *
 * Example output: "Patient-1", "heart-failure-1"
 *
 * Uses PROJECT_PSEUDO_ID.a1 because that field is populated in the RS CDF.
 */
export const rsResourceId = (resourceName: string): string => {
  const pid =
    (inputValue('PROJECT_PSEUDO_ID', 'a1') as string | undefined)?.trim() ||
    (inputValue('project_pseudo_id', 'a1') as string | undefined)?.trim() ||
    'UNKNOWN';

  return `${resourceName}-${pid}`;
};

/**
 * Convenience: numeric value helper.
 *
 * Reads a variable at wave "a1" and returns a number if possible,
 * or undefined if the value is missing or not numeric.
 */
export const rsNumberValue = (varName: string): number | undefined => {
  const raw = inputValue(varName, 'a1') as string | undefined;
  if (!raw) return undefined;

  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
};

/**
 * Convenience: check if a variable at wave "a1" has a non-empty value.
 */
export const rsHasValue = (varName: string): boolean => {
  const raw = inputValue(varName, 'a1') as string | undefined;
  return !!raw && raw.trim() !== '';
};

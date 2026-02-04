import { inputValue, createCheckedAccessProxy } from '../functionsCatalog';
import { testResultFlagsSNOMEDCodelist } from '../codes/snomedCodeLists';

/**
 * Rotterdam Study – Total cholesterol pairing rules
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   TC_mmol.a1        Total cholesterol in mmol/L
 *   date_int_cen.a1   Baseline examination date (DD-MM-YYYY)
 */

export const referenceRangeUpperLimit = function (): number {
  // mmol/L – same upper reference limit as Lifelines
  return 5;
};

export type TotalCholesterolReadingEntry = {
  assessment: string;
  isTotalCholAboveReferenceRange: boolean | undefined;
  resultFlags: object | undefined;
  totalCholResults: number | undefined;
  collectedDateTime: string | undefined;
};

/**
 * Convert DD-MM-YYYY (Rotterdam style) → YYYY-MM-DD (FHIR/ISO).
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
 * Safely parse numeric strings to numbers.
 */
const parseNumeric = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Total cholesterol value from the RS CDF (mmol/L).
 */
const totalCholResults = function (wave: string): number | undefined {
  const totalCholRes = inputValue('TC_mmol', wave);
  return parseNumeric(totalCholRes);
};

/**
 * True if total cholesterol is above reference range; undefined if missing.
 */
const isTotalCholAboveReferenceRange = function (
  wave: string
): boolean | undefined {
  const totalChol = totalCholResults(wave);
  if (totalChol === undefined) return undefined;
  return totalChol > referenceRangeUpperLimit();
};

/**
 * SNOMED flag if total cholesterol is above reference range.
 */
const resultFlags = function (wave: string): object | undefined {
  if (isTotalCholAboveReferenceRange(wave)) {
    return testResultFlagsSNOMEDCodelist.above_reference_range;
  } else {
    return undefined;
  }
};

/**
 * Collection date: baseline exam date from date_int_cen.a1.
 */
const collectedDateTime = function (wave: string): string | undefined {
  const coldate = inputValue('date_int_cen', wave);
  if (coldate !== undefined) {
    return rsDateToISO(coldate);
  } else {
    return undefined;
  }
};

/**
 * Consider the assessment missed when total cholesterol is not available.
 */
const assessmentMissed = function (wave: string): boolean {
  return totalCholResults(wave) === undefined;
};

/**
 * Main entry used by the TotalCholesterol JSONata templates.
 * For Rotterdam we only have baseline wave "a1".
 */
export const results = function (): TotalCholesterolReadingEntry[] {
  const waves = ['a1'];

  return waves
    .filter((wave) => !assessmentMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        isTotalCholAboveReferenceRange: isTotalCholAboveReferenceRange(wave),
        resultFlags: resultFlags(wave),
        totalCholResults: totalCholResults(wave),
        collectedDateTime: collectedDateTime(wave),
      })
    );
};

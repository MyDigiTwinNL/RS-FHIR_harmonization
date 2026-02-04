import { inputValue, createCheckedAccessProxy } from '../functionsCatalog';
import { testResultFlagsSNOMEDCodelist } from '../codes/snomedCodeLists';

/**
 * Rotterdam Study – LDL cholesterol pairing rules
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   LDL_mmol_chosen.a1   LDL cholesterol in mmol/L (choose your preferred LDL variable)
 *   date_int_cen.a1      baseline examination date (DD-MM-YYYY)
 *
 * If your CDF uses a different LDL variable name, change "LDL_mmol_chosen"
 * below accordingly.
 */

export const referenceRangeUpperLimit = function (): number {
  // mmol/L, same cutoff as Lifelines
  return 3;
};

export type LDLCholesterolReadingEntry = {
  assessment: string;
  isLDLAboveReferenceRange: boolean | undefined;
  resultFlags: object | undefined;
  ldlResults: number | undefined;
  collectedDateTime: string | undefined;
};

/**
 * Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD (FHIR/ISO).
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
 * Safely parse numeric strings.
 */
const parseNumeric = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Raw LDL value from the RS CDF.
 */
const ldlResults = (wave: string): number | undefined => {
  // NOTE: change "LDL_mmol_chosen" if your CDF uses another LDL field name.
  const val = inputValue('LDL_mmol_chosen', wave);
  return parseNumeric(val);
};

/**
 * True if LDL is above reference range; undefined if LDL is missing.
 */
const isLDLAboveReferenceRange = (wave: string): boolean | undefined => {
  const ldl = ldlResults(wave);
  if (ldl === undefined) return undefined;
  return ldl > referenceRangeUpperLimit();
};

/**
 * SNOMED flag if LDL is above reference range.
 */
const resultFlags = (wave: string): object | undefined => {
  const above = isLDLAboveReferenceRange(wave);
  if (above === true) {
    // same flag as Lifelines: "Above reference range"
    return testResultFlagsSNOMEDCodelist.above_reference_range;
  }
  return undefined;
};

/**
 * Baseline collection date from date_int_cen.a1.
 */
const collectedDateTime = (wave: string): string | undefined => {
  const coldate = inputValue('date_int_cen', wave);
  if (!coldate) return undefined;
  return rsDateToISO(coldate);
};

/**
 * Consider the LDL assessment missed if no LDL value.
 */
const assessmentMissed = (wave: string): boolean => {
  return ldlResults(wave) === undefined;
};

/**
 * Main export used in the LDLCholesterol JSONata templates.
 * For RS we only have a single baseline wave "a1".
 */
export const results = function (): LDLCholesterolReadingEntry[] {
  const waves = ['a1'];

  return waves
    .filter((wave) => !assessmentMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        isLDLAboveReferenceRange: isLDLAboveReferenceRange(wave),
        resultFlags: resultFlags(wave),
        ldlResults: ldlResults(wave),
        collectedDateTime: collectedDateTime(wave),
      })
    );
};

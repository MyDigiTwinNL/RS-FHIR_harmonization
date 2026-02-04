import { inputValue, createCheckedAccessProxy } from '../functionsCatalog';
import { assertIsDefined } from '../unexpectedInputException';

/**
 * CDF → FHIR pairing rules for Rotterdam Study blood pressure
 *
 * Based on the HCIM BloodPressure / zib BloodPressure profile, but using
 * Rotterdam Study CDF variables:
 *
 *   sbp.a1              systolic blood pressure at baseline
 *   dbp.a1              diastolic blood pressure at baseline
 *   date_int_cen.a1     baseline examination date (DD-MM-YYYY)
 *   PROJECT_PSEUDO_ID.a1  participant ID
 */

export type BloodPressureReadingEntry = {
  assessment: string;
  cuffType: object | undefined;
  measuringLocation: object | undefined;
  systolicBloodPressure: number | undefined;
  diastolicBloodPressure: number | undefined;
  arterialBloodPressure: number | undefined;
  collectedDateTime: string | undefined;
};

/**
 * Simple DD-MM-YYYY → YYYY-MM-DD converter for Rotterdam Study dates.
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
 * Helper to safely parse numeric strings, returning undefined for empty/missing.
 */
const parseNumeric = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * For Rotterdam Study we have a single baseline “wave” a1.
 * If either SBP or DBP is missing, consider the assessment missed.
 */
const missedAssessment = (wave: string): boolean => {
  const sbp = inputValue('sbp', wave);
  const dbp = inputValue('dbp', wave);
  return sbp === undefined || sbp.trim() === '' || dbp === undefined || dbp.trim() === '';
};

/**
 * Main entry point used by the BloodPressure JSONata templates.
 * Returns at most one baseline blood pressure reading for wave "a1".
 */
export const results = function (): BloodPressureReadingEntry[] {
  const waves = ['a1'];

  return waves
    .filter((wave) => !missedAssessment(wave))
    .map((wave) =>
      // Use a checked proxy to catch typos / missing properties in JSONata templates.
      createCheckedAccessProxy({
        assessment: wave,
        cuffType: cuffType(wave),
        measuringLocation: measuringLocation(wave),
        systolicBloodPressure: systolicBloodPressure(wave),
        diastolicBloodPressure: diastolicBloodPressure(wave),
        arterialBloodPressure: arterialBloodPressure(wave),
        collectedDateTime: collectedDateTime(wave),
      })
    );
};

/**
 * RS CDF does not contain cuff type; leave undefined.
 */
export const cuffType = (wave: string): object | undefined => {
  return undefined;
};

/**
 * RS CDF does not contain arm/location; leave undefined.
 */
export const measuringLocation = (wave: string): object | undefined => {
  return undefined;
};

/**
 * Systolic blood pressure from sbp.a1 (mmHg).
 */
export const systolicBloodPressure = (wave: string): number | undefined => {
  return parseNumeric(inputValue('sbp', wave));
};

/**
 * Diastolic blood pressure from dbp.a1 (mmHg).
 */
export const diastolicBloodPressure = (wave: string): number | undefined => {
  return parseNumeric(inputValue('dbp', wave));
};

/**
 * Mean arterial pressure computed as:
 *   MAP = DBP + (SBP - DBP) / 3
 * Only computed when both SBP and DBP are available.
 */
export const arterialBloodPressure = (wave: string): number | undefined => {
  const sbp = systolicBloodPressure(wave);
  const dbp = diastolicBloodPressure(wave);
  if (sbp === undefined || dbp === undefined) return undefined;
  return dbp + (sbp - dbp) / 3;
};

/**
 * Collection date/time: use baseline examination date (date_int_cen.a1).
 */
export const collectedDateTime = (wave: string): string | undefined => {
  const date = inputValue('date_int_cen', wave);
  assertIsDefined(date, `Precondition failed - bloodpressure: missing date_int_cen in assessment ${wave}`);
  return rsDateToISO(date);
};

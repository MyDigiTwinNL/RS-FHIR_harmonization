import { inputValue, createCheckedAccessProxy } from '../functionsCatalog';
import {
  LaboratoryTestResult,
  TestResultEntry,
} from '../fhir-resource-interfaces/laboratoryTestResult';
import {
  getSNOMEDCode,
  getLOINCCode,
  getUCUMCode,
  CodeProperties,
} from '../codes/codesCollection';
import { assertIsDefined } from '../unexpectedInputException';

/**
 * Rotterdam Study – eGFR pairing rules
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   GFR.a1             eGFR (mL/min/1.73m2)
 *   date_int_cen.a1    Baseline exam date (DD-MM-YYYY)
 *
 * This implements the LaboratoryTestResult interface so we can reuse
 * the generic LabTestResult_* JSONata templates.
 */

/* ------------------------------------------------------------------ */
/*  Exported functions – used directly by JSONata as $name()          */
/* ------------------------------------------------------------------ */

/** Name of the lab test (used for resource id prefixes). */
export function labTestName(): string {
  // Keep aligned with Lifelines naming where possible
  return 'eGFR-2009';
}

/** Reference range upper limit – not explicitly encoded. */
export function referenceRangeUpperLimit(): number | undefined {
  return undefined;
}

/** Reference range lower limit – CKD threshold, 60 mL/min/1.73m2. */
export function referenceRangeLowerLimit(): number | undefined {
  return REFERENCE_RANGE_LOWER_LIMIT;
}

/** DiagnosticReport.category.coding – laboratory_report, microbiology_procedure. */
export function diagnosticCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('4241000179101'), getSNOMEDCode('19851009')];
}

/** DiagnosticReport.code.coding – GFR/BSA.pred SerPlBld CKD-EPI (same as Lifelines). */
export function diagnosticCodeCoding(): CodeProperties[] {
  // Lifelines uses 62238-1 and this is defined in codesCollection
  return [getLOINCCode('62238-1')];
}

/** DiagnosticReport.code.text. */
export function diagnosticCodeText(): string {
  return 'Glomerular filtration rate/1.73 sq M.predicted [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI)';
}

/** Observation.category.coding – laboratory test finding, serum chemistry test. */
export function observationCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('49581000146104'), getSNOMEDCode('275711006')];
}

/** Observation.code.coding – same LOINC as DiagnosticReport (62238-1). */
export function observationCodeCoding(): CodeProperties[] {
  return [getLOINCCode('62238-1')];
}

/** Observation.valueQuantity unit (UCUM mL/min/{1.73_m2}). */
export function resultUnit(): CodeProperties {
  return getUCUMCode('mL/min/{1.73_m2}');
}

/**
 * Core results array used by the generic LabTestResult_* JSONata templates.
 * For Rotterdam, we use baseline wave "a1".
 */
export function results(): TestResultEntry[] {
  const waves = ['a1']; // Rotterdam baseline wave

  return waves
    .filter((wave) => !assessmentMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        resultFlags: resultFlags(wave),
        testResult: egfrResult(wave),
        collectedDateTime: collectedDateTime(wave),
      }),
    );
}

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

/** Reference range: eGFR < 60 mL/min/1.73m2 is considered below reference. */
const REFERENCE_RANGE_LOWER_LIMIT = 60;

/** Convert DD-MM-YYYY (Rotterdam style) → YYYY-MM-DD (FHIR/ISO). */
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

/** Safely parse numeric strings. */
const parseNumeric = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
};

/** Get eGFR result from RS CDF (baseline wave). */
const egfrResult = (wave: string): number | undefined => {
  const val = inputValue('GFR', wave);
  return parseNumeric(val);
};

/** True if eGFR is below the reference range (CKD threshold). */
const isEGFRBelowReferenceRange = (wave: string): boolean | undefined => {
  const val = egfrResult(wave);
  if (val === undefined) return undefined;
  return val < REFERENCE_RANGE_LOWER_LIMIT;
};

/**
 * Result flag if eGFR below reference; undefined otherwise.
 * Uses SNOMED 281300000 "Below reference range".
 */
const resultFlags = (wave: string): CodeProperties | undefined => {
  const below = isEGFRBelowReferenceRange(wave);
  if (below === true) {
    return getSNOMEDCode('281300000');
  }
  return undefined;
};

/** Collection date: baseline exam date from date_int_cen.a1. */
const collectedDateTime = (wave: string): string | undefined => {
  const date = inputValue('date_int_cen', wave);
  assertIsDefined(
    date,
    `Precondition failed - eGFR: missing date_int_cen in assessment ${wave}`,
  );
  return rsDateToISO(date);
};

/** Consider the assessment missed when eGFR is not available. */
const assessmentMissed = (wave: string): boolean => {
  return egfrResult(wave) === undefined;
};

/* ------------------------------------------------------------------ */
/*  Optional object export for compatibility                           */
/*  (mapper only registers functions; this is for typing/other use)    */
/* ------------------------------------------------------------------ */

export const eGFR: LaboratoryTestResult = {
  referenceRangeUpperLimit,
  referenceRangeLowerLimit,
  diagnosticCategoryCoding,
  diagnosticCodeCoding,
  diagnosticCodeText,
  observationCategoryCoding,
  observationCodeCoding,
  results,
  resultUnit,
  labTestName,
};

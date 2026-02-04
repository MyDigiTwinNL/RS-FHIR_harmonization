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
 * Rotterdam Study – HDL cholesterol pairing rules
 *
 * RS CDF variables (per participant, baseline wave "a1"):
 *
 *   HDL_mmol.a1        HDL cholesterol in mmol/L
 *   date_int_cen.a1    baseline examination date (DD-MM-YYYY)
 *
 * This implements the same LaboratoryTestResult interface used for Lifelines,
 * so we can reuse the generic LabTestResult_* JSONata templates.
 */

/* ------------------------------------------------------------------ */
/*  Exported functions – used directly by JSONata as $name()          */
/* ------------------------------------------------------------------ */

/** Name of the lab test (used for resource id prefixes). */
export function labTestName(): string {
  return 'hdl-chol';
}

/** Reference range upper limit – only a lower limit is defined for HDL. */
export function referenceRangeUpperLimit(): number | undefined {
  return undefined;
}

/** Reference range lower limit, in mmol/L. */
export function referenceRangeLowerLimit(): number | undefined {
  return REFERENCE_RANGE_LOWER_LIMIT;
}

/** DiagnosticReport.category.coding – laboratory_report, microbiology_procedure. */
export function diagnosticCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('4241000179101'), getSNOMEDCode('19851009')];
}

/** DiagnosticReport.code.coding – LOINC "HDLc SerPl-sCnc". */
export function diagnosticCodeCoding(): CodeProperties[] {
  return [getLOINCCode('14646-4')];
}

/** DiagnosticReport.code.text. */
export function diagnosticCodeText(): string {
  return 'Cholesterol in HDL [Moles/Vol]';
}

/** Observation.category.coding – laboratory test finding, serum chemistry test. */
export function observationCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('49581000146104'), getSNOMEDCode('275711006')];
}

/** Observation.code.coding – LOINC "HDLc SerPl-sCnc". */
export function observationCodeCoding(): CodeProperties[] {
  return [getLOINCCode('14646-4')];
}

/** Observation.valueQuantity unit (UCUM mmol/L). */
export function resultUnit(): CodeProperties {
  return getUCUMCode('mmol/L');
}

/**
 * Core results array used by the generic LabTestResult_* JSONata templates.
 * For Rotterdam, we use baseline wave "a1" only.
 */
export function results(): TestResultEntry[] {
  const waves = ['a1']; // Rotterdam baseline wave

  return waves
    // If the assessment was missed, do not create the resource
    .filter((wave) => !assessmentMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        resultFlags: resultFlags(wave),
        testResult: hdlResults(wave),
        collectedDateTime: collectedDateTime(wave),
      }),
    );
}

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

/** Lower reference limit for HDL (mmol/L); mirrors Lifelines. */
const REFERENCE_RANGE_LOWER_LIMIT = 1;

/** Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD (FHIR/ISO). */
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

/** Safely parse numeric strings, returning undefined for empty/missing/NaN. */
const parseNumeric = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Decide whether HDL is missing for a given assessment.
 * For RS we have a single wave "a1"; if HDL is empty, we skip the resource.
 */
const assessmentMissed = (wave: string): boolean => {
    const hdl = inputValue('HDL_mmol', wave);
    const date = inputValue('date_int_cen', wave);
  
    const hdlMissing = hdl === undefined || hdl.trim() === '';
    const dateMissing = date === undefined || date.trim() === '';
  
    // If either HDL or its date is missing, we consider the assessment missed
    return hdlMissing || dateMissing;
  };
  

/**
 * HDL result (mmol/L) for Rotterdam Study.
 *
 * @param wave baseline wave, e.g. "a1"
 * @returns HDL result, or undefined
 */
const hdlResults = (wave: string): number | undefined => {
  const hdl = inputValue('HDL_mmol', wave);
  return parseNumeric(hdl);
};

/**
 * Is HDL below the reference range?
 *
 * @precondition hdlResults is a number (not undefined)
 */
const isHDLBelowReferenceRange = (wave: string): boolean => {
  const hdl = hdlResults(wave);
  return hdl !== undefined && hdl < REFERENCE_RANGE_LOWER_LIMIT;
};

/**
 * Flag results if HDL is below reference range.
 * Uses SNOMED 281300000 "Below reference range" as in Lifelines.
 */
const resultFlags = (wave: string): CodeProperties | undefined => {
  if (isHDLBelowReferenceRange(wave)) {
    // below_reference_range
    return getSNOMEDCode('281300000');
  } else {
    return undefined;
  }
};

/**
 * Collection date/time for HDL measurement – use baseline exam date.
 *
 * @param wave baseline wave, e.g. "a1"
 */
const collectedDateTime = (wave: string): string | undefined => {
  const date = inputValue('date_int_cen', wave);
  assertIsDefined(
    date,
    `Precondition failed - HDL cholesterol: missing date_int_cen in assessment ${wave}`,
  );
  return rsDateToISO(date);
};

/* ------------------------------------------------------------------ */
/*  Optional: object export for compatibility                          */
/*  (mapper only registers functions; this is for typing/other use)    */
/* ------------------------------------------------------------------ */

export const hdlCholesterol: LaboratoryTestResult = {
  referenceRangeUpperLimit,
  referenceRangeLowerLimit,
  results,
  diagnosticCategoryCoding,
  diagnosticCodeCoding,
  diagnosticCodeText,
  observationCategoryCoding,
  observationCodeCoding,
  resultUnit,
  labTestName,
};

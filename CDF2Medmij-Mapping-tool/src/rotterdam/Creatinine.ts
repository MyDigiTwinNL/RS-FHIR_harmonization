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
 * Rotterdam Study – Creatinine pairing rules
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   creat_umol.a1      Creatinine in µmol/L
 *   sex_mapped.a1      "male" / "female"
 *   date_int_cen.a1    Baseline exam date (DD-MM-YYYY)
 *
 * Same coding as Lifelines:
 *   LOINC 14682-9  "Creat SerPl-sCnc"
 *   UCUM  umol/L
 *   SNOMED result flags:
 *     281302008  Above reference range
 *     281300000  Below reference range
 */

/* ------------------------------------------------------------------ */
/*  Exported functions – these are what JSONata calls                  */
/*  (they will be seen as $labTestName(), $results(), etc.)            */
/* ------------------------------------------------------------------ */

/** Name of the lab test (for resource id prefixes). */
export function labTestName(): string {
  return 'creatinine';
}

/** Reference range upper limit – not encoded explicitly. */
export function referenceRangeUpperLimit(): number | undefined {
  return undefined;
}

/** Reference range lower limit – not encoded explicitly. */
export function referenceRangeLowerLimit(): number | undefined {
  return undefined;
}

/** DiagnosticReport.category.coding – laboratory_report, microbiology_procedure. */
export function diagnosticCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('4241000179101'), getSNOMEDCode('19851009')];
}

/** DiagnosticReport.code.coding – LOINC "Creat SerPl-sCnc". */
export function diagnosticCodeCoding(): CodeProperties[] {
  return [getLOINCCode('14682-9')];
}

/** DiagnosticReport.code.text. */
export function diagnosticCodeText(): string {
  return 'Creatinine [Moles/Vol] in Serum or Plasma';
}

/** Observation.category.coding – laboratory test finding, serum chemistry test. */
export function observationCategoryCoding(): CodeProperties[] {
  return [getSNOMEDCode('49581000146104'), getSNOMEDCode('275711006')];
}

/** Observation.code.coding – LOINC "Creat SerPl-sCnc". */
export function observationCodeCoding(): CodeProperties[] {
  return [getLOINCCode('14682-9')];
}

/** Observation.valueQuantity unit (UCUM µmol/L). */
export function resultUnit(): CodeProperties {
  return getUCUMCode('umol/L');
}

/**
 * Core results array used by the generic LabTestResult_* JSONata templates.
 * For Rotterdam, we only use baseline wave "a1".
 */
export function results(): TestResultEntry[] {
  const waves = ['a1']; // Rotterdam baseline wave

  return waves
    .filter((wave) => !assessmentMissed(wave))
    .map((wave) =>
      createCheckedAccessProxy({
        assessment: wave,
        resultFlags: resultFlags(wave),
        testResult: creatinineResult(wave),
        collectedDateTime: collectedDateTime(wave),
      }),
    );
}

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

/** Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD. */
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

/** Creatinine value (µmol/L) from RS CDF. */
const creatinineResult = (wave: string): number | undefined => {
  const val = inputValue('creat_umol', wave);
  return parseNumeric(val);
};

/** Assessment is considered missed if creatinine is missing. */
const assessmentMissed = (wave: string): boolean => {
  return creatinineResult(wave) === undefined;
};

/** Collection date = baseline exam date, converted to ISO. */
const collectedDateTime = (wave: string): string | undefined => {
  const date = inputValue('date_int_cen', wave);
  assertIsDefined(
    date,
    `Precondition failed - creatinine: missing date_int_cen in assessment ${wave}`,
  );
  return rsDateToISO(date);
};

/**
 * Result flag based on gender-specific reference ranges (µmol/L).
 *
 * If male:
 *   > 110 → Above reference range (281302008)
 *   <  50 → Below reference range (281300000)
 * If female:
 *   >  90 → Above reference range (281302008)
 *   <  50 → Below reference range (281300000)
 */
const resultFlags = (wave: string): CodeProperties | undefined => {
  const creat = creatinineResult(wave);
  if (creat === undefined) return undefined;

  const sexRaw = inputValue('sex_mapped', wave);
  const sex = sexRaw ? sexRaw.toLowerCase() : undefined;

  if (sex === 'male') {
    if (creat > 110) {
      return getSNOMEDCode('281302008'); // above reference range
    } else if (creat < 50) {
      return getSNOMEDCode('281300000'); // below reference range
    } else {
      return undefined;
    }
  } else if (sex === 'female') {
    if (creat > 90) {
      return getSNOMEDCode('281302008');
    } else if (creat < 50) {
      return getSNOMEDCode('281300000');
    } else {
      return undefined;
    }
  } else {
    // Unknown sex → no flag
    return undefined;
  }
};

/* ------------------------------------------------------------------ */
/*  Optional: keep an object export for compatibility                  */
/*  (mapper only registers functions; this is for typing/other use)    */
/* ------------------------------------------------------------------ */

export const creatinine: LaboratoryTestResult = {
  labTestName,
  referenceRangeUpperLimit,
  referenceRangeLowerLimit,
  diagnosticCategoryCoding,
  diagnosticCodeCoding,
  diagnosticCodeText,
  observationCategoryCoding,
  observationCodeCoding,
  resultUnit,
  results,
};

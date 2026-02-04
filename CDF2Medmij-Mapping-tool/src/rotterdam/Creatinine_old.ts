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

export const creatinine: LaboratoryTestResult = {
  labTestName: function (): string {
    return 'creatinine';
  },

  referenceRangeUpperLimit: function (): number | undefined {
    // We only encode thresholds in resultFlags; no fixed RR in the resource.
    return undefined;
  },

  referenceRangeLowerLimit: function (): number | undefined {
    return undefined;
  },

  diagnosticCategoryCoding: function (): CodeProperties[] {
    // laboratory_report, microbiology_procedure
    return [getSNOMEDCode('4241000179101'), getSNOMEDCode('19851009')];
  },

  diagnosticCodeCoding: function (): CodeProperties[] {
    // "Creat SerPl-sCnc"
    return [getLOINCCode('14682-9')];
  },

  diagnosticCodeText: function (): string {
    return 'Creatinine [Moles/Vol] in Serum or Plasma';
  },

  observationCategoryCoding: function (): CodeProperties[] {
    // Laboratory test finding, Serum chemistry test
    return [getSNOMEDCode('49581000146104'), getSNOMEDCode('275711006')];
  },

  observationCodeCoding: function (): CodeProperties[] {
    return [getLOINCCode('14682-9')];
  },

  resultUnit: function (): CodeProperties {
    // µmol/L
    return getUCUMCode('umol/L');
  },

  results: function (): TestResultEntry[] {
    const waves = ['a1']; // Rotterdam baseline wave

    return waves
      .filter((wave) => !assessmentMissed(wave))
      .map((wave) =>
        createCheckedAccessProxy({
          assessment: wave,
          resultFlags: resultFlags(wave),
          testResult: creatinineResult(wave),
          collectedDateTime: collectedDateTime(wave),
        })
      );
  },
};

/**
 * Convert DD-MM-YYYY (Rotterdam) → YYYY-MM-DD.
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
 * Creatinine value (µmol/L) from RS CDF.
 */
const creatinineResult = (wave: string): number | undefined => {
  const val = inputValue('creat_umol', wave);
  return parseNumeric(val);
};

/**
 * Assessment is missed if creatinine is missing.
 */
const assessmentMissed = (wave: string): boolean => {
  return creatinineResult(wave) === undefined;
};

/**
 * Collection date = baseline exam date.
 */
const collectedDateTime = (wave: string): string | undefined => {
  const date = inputValue('date_int_cen', wave);
  assertIsDefined(
    date,
    `Precondition failed - creatinine: missing date_int_cen in assessment ${wave}`
  );
  return rsDateToISO(date);
};

/**
 * Result flag based on gender-specific reference ranges.
 *
 * Thresholds (as in Lifelines comments, µmol/L):
 *
 *   If male:
 *     >110  → Above reference range (281302008)
 *     <50   → Below reference range (281300000)
 *   If female:
 *     >90   → Above reference range (281302008)
 *     <50   → Below reference range (281300000)
 */
const resultFlags = (wave: string): CodeProperties | undefined => {
  const creat = creatinineResult(wave);
  if (creat === undefined) return undefined;

  const sex = inputValue('sex_mapped', wave)?.toLowerCase();

  if (sex === 'male') {
    if (creat > 110) {
      return getSNOMEDCode('281302008'); // above_reference_range
    } else if (creat < 50) {
      return getSNOMEDCode('281300000'); // below_reference_range
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

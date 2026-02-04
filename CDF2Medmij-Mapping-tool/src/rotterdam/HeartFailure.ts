import { inputValue } from '../functionsCatalog';
import { Condition } from '../fhir-resource-interfaces/condition';
import { getSNOMEDCode, CodeProperties } from '../codes/codesCollection';

/**
 * Rotterdam Study – Heart Failure condition
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   inc_hf_2018.a1      0/1 indicator for incident heart failure
 *   enddat_hf.a1        event/censor date for HF (DD-MM-YYYY)
 *
 * Differences vs. Lifelines:
 *   - HF is registry-linked (ICD-based), not self-reported.
 *   - We use the actual event date when inc_hf_2018 = 1.
 *   - No midpoint imputation or custom pairing rule over multiple waves.
 */

const WAVE = 'a1';

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

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
 * Incident heart failure?
 */
const hasIncidentHF = (wave: string): boolean => {
  const flag = inputValue('inc_hf_2018', wave);
  if (flag === undefined) return false;
  const norm = flag.toString().toLowerCase().trim();
  return norm === '1' || norm === 'true' || norm === 'yes';
};

/**
 * Event date for first incident HF.
 * We only treat enddat_hf as an event date when inc_hf_2018 == 1.
 */
const incidentHFDate = (wave: string): string | undefined => {
  if (!hasIncidentHF(wave)) return undefined;
  const raw = inputValue('enddat_hf', wave);
  if (!raw || raw.trim() === '') return undefined;
  return rsDateToISO(raw);
};

/* ------------------------------------------------------------------ */
/*  Exported functions – used by generic Condition.jsonata            */
/*  as $conditionName(), $isPresent(), etc.                           */
/* ------------------------------------------------------------------ */

/** Name of the condition, used by Condition.jsonata for ids. */
export function conditionName(): string {
  return 'heart-failure';
}

/** Present if the participant has an incident HF event. */
export function isPresent(): boolean {
  return hasIncidentHF(WAVE);
}

/**
 * Clinical status: "active" if HF is present.
 *
 * SNOMED 55561003 – Active
 */
export function clinicalStatus(): CodeProperties | undefined {
  if (!hasIncidentHF(WAVE)) return undefined;
  return getSNOMEDCode('55561003');
}

/**
 * Verification status – keep same pattern as Lifelines (unknown).
 */
export function verificationStatus(): CodeProperties {
  // "UNK" placeholder used in Lifelines Condition modules
  return getSNOMEDCode('UNK');
}

/**
 * SNOMED code for heart failure:
 *   84114007 – Heart failure (disorder)
 */
export function code(): CodeProperties {
  return getSNOMEDCode('84114007');
}

/**
 * Onset date/time of heart failure.
 * Directly uses the registry-linked event date (enddat_hf.a1)
 * when inc_hf_2018 = 1; no midpoint imputation.
 */
export function onsetDateTime(): string | undefined {
  return incidentHFDate(WAVE);
}

/* ------------------------------------------------------------------ */
/*  Optional object export for typing / compatibility                  */
/*  (mapper only registers the functions above for JSONata)           */
/* ------------------------------------------------------------------ */

export const heartFailure: Condition = {
  conditionName,
  isPresent,
  clinicalStatus,
  verificationStatus,
  code,
  onsetDateTime,
};

import { inputValue } from '../functionsCatalog';
import { Condition } from '../fhir-resource-interfaces/condition';
import { getSNOMEDCode, CodeProperties } from '../codes/codesCollection';

/**
 * Rotterdam Study – Myocardial Infarction (MI) condition
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   incident_mi_bool.a1            "True" / "False" / "1" / "0"
 *   incident_mi_date_derived.a1    date of first incident MI (DD-MM-YYYY)
 *
 * Different from Lifelines:
 *   - Outcomes come from registry linkage (ICD-based), not self-report.
 *   - We have the actual event date → no midpoint imputation or complex pairing rule.
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
 * Helper: does this participant have an incident myocardial infarction?
 */
const hasIncidentMIInternal = (wave: string): boolean => {
  const flag = inputValue('incident_mi_bool', wave);
  if (flag === undefined) return false;
  const norm = flag.toString().toLowerCase().trim();
  return norm === 'true' || norm === '1' || norm === 'yes';
};

/**
 * Helper: event date for the first incident MI, if any.
 */
const incidentMIDateInternal = (wave: string): string | undefined => {
  if (!hasIncidentMIInternal(wave)) return undefined;

  const raw = inputValue('incident_mi_date_derived', wave);
  if (!raw || raw.trim() === '') return undefined;
  return rsDateToISO(raw);
};

/* ------------------------------------------------------------------ */
/*  Exported functions – used by Condition.jsonata as $name()         */
/* ------------------------------------------------------------------ */

/** Keep same name as Lifelines so ids remain compatible. */
export function conditionName(): string {
  return 'MI';
}

/** The condition is present if there is an incident MI. */
export function isPresent(): boolean {
  return hasIncidentMIInternal(WAVE);
}

/**
 * Clinical status: "active" when there is an incident MI.
 *
 * SNOMED 55561003 – Active
 */
export function clinicalStatus(): CodeProperties | undefined {
  if (!hasIncidentMIInternal(WAVE)) return undefined;
  return getSNOMEDCode('55561003');
}

/**
 * Verification status: keep the same "unknown" code as the Lifelines
 * implementation, so downstream logic stays identical.
 */
export function verificationStatus(): CodeProperties {
  // "UNK" placeholder code as used in Lifelines Condition modules
  return getSNOMEDCode('UNK');
}

/**
 * SNOMED code for myocardial infarction:
 *   22298006 – Myocardial infarction (disorder)
 */
export function code(): CodeProperties {
  return getSNOMEDCode('22298006');
}

/**
 * Onset date of the myocardial infarction:
 *   - Directly use the registry-linked event date from
 *     incident_mi_date_derived.a1
 *   - No midpoint imputation, no self-report follow-up logic.
 */
export function onsetDateTime(): string | undefined {
  return incidentMIDateInternal(WAVE);
}

/* ------------------------------------------------------------------ */
/*  Optional object export for typing / compatibility                  */
/*  (mapper only registers the functions above for JSONata)           */
/* ------------------------------------------------------------------ */

export const myocardialInfarction: Condition = {
  conditionName,
  isPresent,
  clinicalStatus,
  verificationStatus,
  code,
  onsetDateTime,
};

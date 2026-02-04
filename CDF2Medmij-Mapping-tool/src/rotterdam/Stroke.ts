import { inputValue } from '../functionsCatalog';
import { Condition } from '../fhir-resource-interfaces/condition';
import { getSNOMEDCode, CodeProperties } from '../codes/codesCollection';

/**
 * Rotterdam Study – Stroke condition
 *
 * RS CDF variables (baseline wave "a1"):
 *
 *   incident_stroke_bool.a1          "True"/"False", "1"/"0", etc.
 *   incident_stroke_date_derived.a1  date of first incident stroke (DD-MM-YYYY)
 *
 * Different from Lifelines:
 *   - No self-reported follow-up waves
 *   - No midpoint imputation: we use the actual event date from the registry
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
 * Helper: does this participant have an incident stroke?
 */
const hasIncidentStrokeInternal = (wave: string): boolean => {
  const flag = inputValue('incident_stroke_bool', wave);
  if (flag === undefined) return false;

  const norm = flag.toString().toLowerCase().trim();
  return norm === 'true' || norm === '1' || norm === 'yes';
};

/**
 * Helper: event date for the first incident stroke, if any.
 */
const incidentStrokeDateInternal = (wave: string): string | undefined => {
  if (!hasIncidentStrokeInternal(wave)) return undefined;

  const raw = inputValue('incident_stroke_date_derived', wave);
  if (!raw || raw.trim() === '') return undefined;

  return rsDateToISO(raw);
};

/* ------------------------------------------------------------------ */
/*  Exported functions – used by Condition.jsonata as $name()         */
/* ------------------------------------------------------------------ */

/** Condition name, used by generic Condition.jsonata for ids. */
export function conditionName(): string {
  return 'stroke';
}

/** Present if there is an incident stroke. */
export function isPresent(): boolean {
  return hasIncidentStrokeInternal(WAVE);
}

/**
 * Clinical status: use "active" when there is an incident stroke,
 * otherwise undefined (no Condition should be emitted when !isPresent).
 *
 * SNOMED 55561003 – Active
 */
export function clinicalStatus(): CodeProperties | undefined {
  if (!hasIncidentStrokeInternal(WAVE)) return undefined;
  return getSNOMEDCode('55561003');
}

/**
 * Verification status. Lifelines uses an "unknown" placeholder;
 * we keep the same behaviour for consistency.
 */
export function verificationStatus(): CodeProperties {
  // "UNK" is the placeholder key used in Lifelines Condition modules
  return getSNOMEDCode('UNK');
}

/**
 * SNOMED code for cerebrovascular accident:
 *   230690007 – Cerebrovascular accident (disorder)
 */
export function code(): CodeProperties {
  return getSNOMEDCode('230690007');
}

/**
 * Onset date of the stroke:
 *   - Directly use the registry-linked event date from
 *     incident_stroke_date_derived.a1
 *   - No midpoint imputation or self-report-based pairing rule.
 */
export function onsetDateTime(): string | undefined {
  return incidentStrokeDateInternal(WAVE);
}

/* ------------------------------------------------------------------ */
/*  Optional object export for typing / compatibility                  */
/*  (mapper only registers the functions above for JSONata)           */
/* ------------------------------------------------------------------ */

export const stroke: Condition = {
  conditionName,
  isPresent,
  clinicalStatus,
  verificationStatus,
  code,
  onsetDateTime,
};

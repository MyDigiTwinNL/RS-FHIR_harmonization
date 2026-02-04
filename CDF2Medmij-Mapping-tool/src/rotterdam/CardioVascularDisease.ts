import { inputValue } from '../functionsCatalog';
import { Condition } from '../fhir-resource-interfaces/condition';
import { getSNOMEDCode, CodeProperties } from '../codes/codesCollection';

/**
 * Rotterdam Study – Composite Cardiovascular Disease (CVD)
 *
 * Expected RS CDF variables (baseline wave "a1"):
 *
 *   incident_cvd_composite_bool.a1     "True" / "False" / "1" / "0"
 *   incident_cvd_date_derived.a1       earliest of MI / Stroke / HF (DD-MM-YYYY)
 *
 * Notes:
 *   - RS is registry-linked → true diagnosis dates → no midpoint imputation.
 *   - We rely on your preprocessing script to derive the composite fields.
 */

const WAVE = 'a1';

/* ------------------------------------------------------------------ */
/*  Internal helpers (not exported)                                   */
/* ------------------------------------------------------------------ */

/**
 * Convert DD-MM-YYYY → YYYY-MM-DD for FHIR.
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
 * Whether RS participant has composite incident CVD.
 */
const hasIncidentCVD = (wave: string): boolean => {
  const raw = inputValue('incident_cvd_composite_bool', wave);
  if (raw === undefined) return false;

  const norm = raw.toString().toLowerCase().trim();
  return norm === 'true' || norm === '1' || norm === 'yes';
};

/**
 * Earliest event date among MI, Stroke, HF (derived beforehand).
 */
const incidentCVDDate = (wave: string): string | undefined => {
  if (!hasIncidentCVD(wave)) return undefined;

  const raw = inputValue('incident_cvd_date_derived', wave);
  if (!raw || raw.trim() === '') return undefined;

  return rsDateToISO(raw);
};

/* ------------------------------------------------------------------ */
/*  Exported functions – called by generic Condition.jsonata          */
/*  as $conditionName(), $isPresent(), etc.                           */
/* ------------------------------------------------------------------ */

/** Name expected by generic Condition.jsonata template. */
export function conditionName(): string {
  return 'composite-cvd';
}

/** Composite CVD is present if any component outcome is present. */
export function isPresent(): boolean {
  return hasIncidentCVD(WAVE);
}

/**
 * Clinical status → active when condition is present.
 *
 * SNOMED: 55561003 — "active"
 */
export function clinicalStatus(): CodeProperties | undefined {
  if (!hasIncidentCVD(WAVE)) return undefined;
  return getSNOMEDCode('55561003');
}

/**
 * Verification status → keep the Lifelines "unknown" code.
 */
export function verificationStatus(): CodeProperties {
  return getSNOMEDCode('UNK');
}

/**
 * SNOMED code for cardiovascular disease (composite):
 *
 *   49601007 — Cardiovascular disease (disorder)
 */
export function code(): CodeProperties {
  return getSNOMEDCode('49601007');
}

/**
 * Onset = earliest actual event date.
 * No midpoint imputation needed.
 */
export function onsetDateTime(): string | undefined {
  return incidentCVDDate(WAVE);
}

/* ------------------------------------------------------------------ */
/*  Optional object export for typing / compatibility                  */
/*  (mapper only registers the functions above for JSONata)           */
/* ------------------------------------------------------------------ */

export const cardioVascularDisease: Condition = {
  conditionName,
  isPresent,
  clinicalStatus,
  verificationStatus,
  code,
  onsetDateTime,
};

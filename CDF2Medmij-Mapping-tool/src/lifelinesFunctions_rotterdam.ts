import { inputValue } from './functionsCatalog';

/**
 * Rotterdam Study helper functions
 *
 * These replace lifelinesFunctions.ts for modules under src/rotterdam.
 * They are deliberately minimal: only what RS needs.
 */

/** Convert DD-MM-YYYY → YYYY-MM-DD */
export const rsDateToISO = (ddmmyyyy: string | undefined): string | undefined => {
  if (!ddmmyyyy) return undefined;
  const p = ddmmyyyy.split('-');
  if (p.length !== 3) return undefined;
  const [d, m, y] = p.map(Number);
  if (!d || !m || !y) return undefined;
  return `${y}-${m < 10 ? '0'+m : m}-${d < 10 ? '0'+d : d}`;
};

/** Safe numeric reader */
export const rsNumeric = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

/** Boolean flag parser */
export const rsBool = (val: string | undefined): boolean => {
  if (!val) return false;
  const norm = val.toLowerCase().trim();
  return norm === '1' || norm === 'true' || norm === 'yes';
};

/** Participant ID for RS (always wave a1) */
const rsParticipantId = (): string => {
  const v = inputValue('project_pseudo_id', 'a1');
  if (!v) throw new Error(`Missing project_pseudo_id.a1`);
  return v;
};

/** Resource ID (no wave) */
export const resourceId = (resourceName: string): string => {
  return `${resourceName}-${rsParticipantId()}`;
};

/** Resource ID with wave */
export const waveSpecificResourceId = (resourceName: string, wave: string): string => {
  return `${resourceName}-${wave}-${rsParticipantId()}`;
};

/** Export as namespace-like object (optional convenience) */
export const rotterdamFunctions = {
  rsDateToISO,
  rsNumeric,
  rsBool,
  resourceId,
  waveSpecificResourceId,
};

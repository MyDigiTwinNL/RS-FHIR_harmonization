import { inputValue } from '../functionsCatalog';
import { genderFHIRV3Codes } from '../codes/fhirv3codes';
import { rsDateToISO, rsBaselineDate } from './rsFunctions';

/*
Rotterdam Study Patient mapping

- All dates in the RS CDF are stored as strings in DD-MM-YYYY format
  (e.g. "29-02-2000").
- FHIR requires ISO 8601 dates (YYYY-MM-DD) for birthDate, onsetDateTime, etc.
  We therefore always convert RS dates using rsDateToISO.

Relevant RS CDF variables (wave "a1"):

  gebdatum                      : date of birth (DD-MM-YYYY)
  date_int_cen                  : baseline interview date (DD-MM-YYYY)

  age_at_baseline_years_derived : age at baseline (years, rounded; preferred)
  age_at_baseline_years         : age at baseline (years, original)
  age                           : age at baseline (years, original)

  sex_mapped                    : "male" / "female" (preferred)
  sexe                          : original coded sex ("1"=male, "2"=female)
*/

/**
 * Returns the patient's birthDate as an ISO string (YYYY-MM-DD).
 *
 * Primary source:
 *   - gebdatum (exact date of birth → convert with rsDateToISO)
 *
 * Fallback:
 *   - approximate from baseline date (date_int_cen) and age at baseline
 *     if gebdatum is not available.
 */
export const birthDate = (): string | undefined => {
  // 1. Exact date of birth if available
  const dob = inputValue('gebdatum', 'a1') as string | undefined;
  if (dob && dob.trim() !== '') {
    return rsDateToISO(dob);
  }

  // 2. Fallback: approximate from baseline date + age
  const baselineIso = rsBaselineDate();
  const ageStr =
    (inputValue('age_at_baseline_years_derived', 'a1') as string | undefined) ||
    (inputValue('age_at_baseline_years', 'a1') as string | undefined) ||
    (inputValue('age', 'a1') as string | undefined);

  if (!baselineIso || !ageStr || ageStr.trim() === '') {
    return undefined;
  }

  const age = Number(ageStr);
  if (Number.isNaN(age)) {
    return undefined;
  }

  // baselineIso = "YYYY-MM-DD"
  const surveyYear = Number(baselineIso.slice(0, 4));
  if (Number.isNaN(surveyYear)) {
    return undefined;
  }

  // Simple approximation: subtract age (in years) and keep same month/day
  const birthYear = Math.round(surveyYear - age);
  const monthDay = baselineIso.slice(5); // "-MM-DD"
  return `${birthYear}-${monthDay}`;
};

/**
 * Returns the patient's gender using the FHIR V3 codes expected
 * by the zib-2017 Patient template.
 *
 * Primary source:
 *   - sex_mapped: "male"/"female"
 *
 * Fallback:
 *   - sexe: "1" (male), "2" (female)
 */
export const gender = (): object | undefined => {
  const mapped = inputValue('sex_mapped', 'a1') as string | undefined;

  if (mapped && mapped.trim() !== '') {
    const val = mapped.trim().toLowerCase();
    if (val === 'male' || val === 'man' || val === 'm') {
      return genderFHIRV3Codes.male;
    }
    if (val === 'female' || val === 'vrouw' || val === 'f') {
      return genderFHIRV3Codes.female;
    }
  }

  const sexe = inputValue('sexe', 'a1') as string | undefined;
  if (sexe === '1') {
    return genderFHIRV3Codes.male;
  }
  if (sexe === '2') {
    return genderFHIRV3Codes.female;
  }

  return undefined;
};

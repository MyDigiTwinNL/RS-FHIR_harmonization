"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gender = exports.deceasedDateTime = exports.birthDate = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const fhirv3codes_1 = require("../codes/fhirv3codes");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
/*
Based on HCIM resource:
https://simplifier.net/packages/nictiz.fhir.nl.stu3.zib2017/2.2.12/files/2002232/~overview

Related Lifelines variables:
gender, age (See Lifelines data manual)

*/
/**
 *
 * @precondition in reported age is defined, it is a number
 *
 * @returns approximate birthdate given the baseline assessment date and the reported age. Undefined
 *          if there is no reported age or undefined assessment date.
 */
const birthDate = () => {
    const assessmetDate = (0, functionsCatalog_1.inputValue)("date", "1a");
    if (assessmetDate === undefined) {
        return undefined;
    }
    else {
        const surveyDateParts = assessmetDate.split("-");
        const reportedAge = (0, functionsCatalog_1.inputValue)("age", "1a");
        if (reportedAge != undefined) {
            const surveyAge = Number(reportedAge);
            const surveyYear = Number(surveyDateParts[0]);
            return (surveyYear - surveyAge).toString();
        }
        else {
            return undefined;
        }
    }
};
exports.birthDate = birthDate;
const deceasedDateTime = () => {
    const dod = (0, functionsCatalog_1.inputValue)("date_of_death", "global");
    if (dod !== undefined) {
        return (0, lifelinesFunctions_1.lifelinesDateToISO)(dod);
    }
    else {
        return undefined;
    }
};
exports.deceasedDateTime = deceasedDateTime;
const gender = () => {
    if ((0, functionsCatalog_1.inputValue)("gender", "1a") === "MALE") {
        return fhirv3codes_1.genderFHIRV3Codes.male;
    }
    else if ((0, functionsCatalog_1.inputValue)("gender", "1a") === "FEMALE") {
        return fhirv3codes_1.genderFHIRV3Codes.female;
    }
    else {
        return undefined;
    }
};
exports.gender = gender;
//# sourceMappingURL=Patient.js.map
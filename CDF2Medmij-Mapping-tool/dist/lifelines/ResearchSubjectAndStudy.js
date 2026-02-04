"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchSubjectAndStudy = void 0;
const researchSubjectAndStudy_1 = require("../fhir-resource-interfaces/researchSubjectAndStudy");
const unexpectedInputException_1 = require("../unexpectedInputException");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const functionsCatalog_1 = require("../functionsCatalog");
/**
 *                       [global][1a][1b][1c][2a][3a][3b]
 *  "date_of_inclusion": [     X]
 *  "date":              [      ][ x][ x][ x][ x][ x][ x]
 *
 *
 *
 */
exports.researchSubjectAndStudy = {
    studyName: function () {
        return "Lifelines-Netherlands";
    },
    studyStatus: function () {
        return researchSubjectAndStudy_1.StudyStatus.COMPLETED;
    },
    dateOfInclusion: function () {
        const dateOfInclusion = (0, functionsCatalog_1.inputValue)('date_of_inclusion', 'global');
        (0, unexpectedInputException_1.assertIsDefined)(dateOfInclusion, `Date of inclusion is expected to be not null for all participants`);
        return (0, lifelinesFunctions_1.lifelinesDateToISO)(dateOfInclusion);
    },
    dateOfLastResponse: function () {
        const assessmentDates = (0, functionsCatalog_1.inputValues)('date');
        //Filter the assessment dates without an undefined value as [key,value] tuples
        const effectiveAssessments = Object.entries(assessmentDates).filter(([k, v]) => v !== undefined);
        //Get the last assessment
        const lastEffectiveAssessment = effectiveAssessments.pop();
        (0, unexpectedInputException_1.assertIsDefined)(lastEffectiveAssessment, `It is expected at least one non-null assessment date`);
        //! operator added it is not possible for the tuple value to be undefined, given the filtering
        return (0, lifelinesFunctions_1.lifelinesDateToISO)(lastEffectiveAssessment[1]);
    }
};
//# sourceMappingURL=ResearchSubjectAndStudy.js.map
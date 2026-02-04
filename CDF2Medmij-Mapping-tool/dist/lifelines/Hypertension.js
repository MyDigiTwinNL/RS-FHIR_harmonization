"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.code = exports.verificationStatus = exports.onsetDateTime = exports.clinicalStatus = exports.isPresent = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const moize_1 = __importDefault(require("moize"));
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const unexpectedInputException_1 = require("../unexpectedInputException");
/*
Based on HCIM Problem resource:
https://simplifier.net/packages/nictiz.fhir.nl.stu3.zib2017/2.2.12/files/2002573

Related Lifelines variables:
http://wiki.lifelines.nl/doku.php?id=diabetes&s[]=diabetes&s[]=startage&s[]=adu&s[]=1
*/
/**
 * Defines whether the output of the mapping should be included in the participant's bundle.
 *
 * Related variables/functions:
 * ------------------------------------------------------------------
 * clinicalStatus()
 *
 * ------------------------------------------------------------------
 * There us no such a thing as 'inactive' diabetes. Therefore, the Diabetes resource will be
 * generated only when the clinicalStatus() is active.
 *
 */
const isPresent = () => (0, exports.clinicalStatus)() === snomedCodeLists_1.clinicalStatusSNOMEDCodeList.active;
exports.isPresent = isPresent;
/**
 * The problem status describes the condition of the problem: Active problems are problems of which the patient experiences
 * symptoms or for which evidence exists. Problems with the status 'Inactive' refer to problems that don't affect the patient
 * anymore or that of which there is no evidence of existence anymore.
 *
 *
 *
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * hypertension_presence_adu_q_1  [X ][  ][  ][  ][X ][X ] have you ever had hypertension?
 * ------------------------------------------------------------------
 *
 *
 *
 * @pairingrule
 *  if hypertension_presence_adu_q_1 = yes in 1A, 3A or 3B => active.
 *  else
 *      an 'empty' result is returned, as there is no such a thing as 'inactive' hypertension.
 *
 */
const clinicalStatus = () => {
    const hypertpres = (0, functionsCatalog_1.inputValues)('hypertension_presence_adu_q_1');
    return _clinicalStatus(hypertpres);
};
exports.clinicalStatus = clinicalStatus;
/**
 * Memoized function for clinicalStatus
 */
const _clinicalStatus = (0, moize_1.default)((hypertension_presence_assessments) => {
    if (Object.values(hypertension_presence_assessments).some((wavereading) => wavereading === "1")) {
        return snomedCodeLists_1.clinicalStatusSNOMEDCodeList.active;
    }
    else {
        return {};
    }
});
/**
 * Start of the disorder to which the problem applies. Especially in symptoms in which it takes
 * longer for the final diagnosis, it is important to know not only the date of the diagnosis,
 * but also how long the patient has had the disorder. A ‘vague’ date, such as only the year or
 * the month and the year, is permitted.
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * hypertension_startage_adu_q_1  [X ][  ][  ][  ][X ][X ] how old were you when hypertension was first diagnosed?
 * hypertension_presence_adu_q_1  [X ][  ][  ][  ][X ][X ] have you ever had hypertension?
 * date                           [X ][X ][X ][X ][X ][X ]
 * age                            [X ]
 * ------------------------------------------------------------------
 *
 * @precondition
 *      - date is not a missing value
 *      - the problem is 'active' (see clinicalStatus function)
 *
 * @pairingrule
 *   the year when the participand had the age reported in hypertension_startage_adu_q_1, in the first assessment
 *     (1A, 3A, or 3B) where hypertension_presence_adu_q_1 == yes
 *   if the age reported on that particular assessment (hypertension_startage_adu_q_1) is missing, the date is undefined.
 *
 * @question
 *   to be discussed
 *
 */
const onsetDateTime = () => {
    const firstAssessmentDate = (0, functionsCatalog_1.inputValue)("date", "1a");
    (0, unexpectedInputException_1.assertIsDefined)(firstAssessmentDate, 'Non-null assessment date expected (Hypertension)');
    const firstAssessmentAge = (0, functionsCatalog_1.inputValue)("age", "1a");
    //find the first assessment where hypertension_presence_adu_q_1=yes
    const hypPresence = Object.entries((0, functionsCatalog_1.inputValues)("hypertension_presence_adu_q_1")).find(([key, value]) => value === "1");
    (0, unexpectedInputException_1.assertIsDefined)(hypPresence, `A 'yes' value in hypertension_presence_adu_q_1 is expected as the clinical status is active`);
    const hypPresenceAssessment = hypPresence[0];
    const hypStartAge = (0, functionsCatalog_1.inputValue)('hypertension_startage_adu_q_1', hypPresenceAssessment);
    if (hypStartAge !== undefined && firstAssessmentAge !== undefined) {
        const surveyDateParts = firstAssessmentDate.split("-");
        const surveyAge = Number(firstAssessmentAge);
        const surveyYear = Number(surveyDateParts[0]);
        return (surveyYear - surveyAge + Number(hypStartAge)).toString();
    }
    else {
        return undefined;
    }
};
exports.onsetDateTime = onsetDateTime;
/**
 *
 */
const verificationStatus = () => {
    return snomedCodeLists_1.verificationStatusSNOMEDCodeList.unknwon;
};
exports.verificationStatus = verificationStatus;
const code = () => (snomedCodeLists_1.conditionsSNOMEDCodeList.hypertensive_disorder);
exports.code = code;
//# sourceMappingURL=Hypertension.js.map
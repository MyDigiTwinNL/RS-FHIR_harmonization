"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineDiabetesTypeCode = exports.diabetes = void 0;
const moize_1 = __importDefault(require("moize"));
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
exports.diabetes = {
    conditionName: function () {
        return "diabetes";
    },
    isPresent: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("diabetes_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("diabetes_followup_adu_q_1")) === (0, codesCollection_1.getSNOMEDCode)("55561003");
    },
    /**
     * The problem status describes the condition of the problem: Active problems are problems of which the patient experiences
     * symptoms or for which evidence exists. Problems with the status 'Inactive' refer to problems that don't affect the patient
     * anymore or that of which there is no evidence of existence anymore.
     *
     * Related variables:
     * ------------------------------------------------------------------
     *                                [1A][1B][1C][2A][3A][3B]
     * diabetes_presence_adu_q_1      [X ][  ][  ][  ][  ][  ]
     * diabetes_followup_adu_q_1      [  ][X ][X ][X ][X ][X ]
     * ------------------------------------------------------------------
     *
     * @precondition
     *      - no missing values
     *
     * @pairingrule
     *      if diabetes_presence_adu_q_1 = yes in 1A => SNOMED code for active.
     *      else
     *          if diabetes_presence_adu_q_1 = no, and there is a 'yes' on diabetes_followup_adu_q_1 in any of the
     *          follow-up assessments => active.
     *          else
     *              an empty object is returned, as there is no such a thing as 'inactive' diabetes given the
     *              definition used by the profile: Problems with the status 'Inactive' refer to problems that don't
     *              affect the patient anymore or that of which there is no evidence of existence anymore.
     *
     */
    clinicalStatus: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("diabetes_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("diabetes_followup_adu_q_1"));
    },
    /**
     * Start of the disorder to which the problem applies. Especially in symptoms in which it takes
     * longer for the final diagnosis, it is important to know not only the date of the diagnosis,
     * but also how long the patient has had the disorder. A ‘vague’ date, such as only the year or
     * the month and the year, is permitted.
     *
     * Related variables:
     * ------------------------------------------------------------------
     *                                [1A][1B][1C][2A][3A][3B]
     * diabetes_startage_adu_q_1      [X ][  ][  ][  ][  ][  ]
     * diabetes_presence_adu_q_1      [X ][  ][  ][  ][  ][  ]
     * diabetes_followup_adu_q_1      [  ][X ][X ][X ][X ][X ]
     * date                           [X ][X ][X ][X ][X ][X ]
     * ------------------------------------------------------------------
     *
     * @precondition
     *      - the problem is 'active' (see clinicalStatus function)
     *      - if there is a diabetes report on a follow-up 'diabetes_followup_adu_q_1', there should be a 'yes' value
     *        in either t2d_followup_adu_q_1 or t2d_followup_adu_q_1 (diabetes type)
     *
     *
     * @pairingrule
     *      if diabetes_presence_adu_q_1 = yes in 1A =>
     *              if start_age was reported, approximate year of the event given start_age reported (diabetes_startage_adu_q_1)
     *                  and the year of the year of the assessment.
     *              else
     *                  undefined onset date
     *      else
     *          if there is a 'yes' in any diabetes_followup_adu_q_1 =>
     *              If the date of the assessment where diabetes_followup_adu_q_1 = yes is available =>
     *                  mean date between that particular date (when diabetes_followup_adu_q_1 = yes), and the date of the preceding assessment.
     *              Else
     *                  return undefined onset date
     *          else
     *              error/precondition violated ('diabetes' is not 'active' if the execution reached this point)
     *
     */
    onsetDateTime: function () {
        (0, unexpectedInputException_1.assertIsDefined)((0, functionsCatalog_1.inputValue)("date", "1a"), 'failed precondition: non-null date is expected (Diabetes)');
        if ((0, functionsCatalog_1.inputValue)("diabetes_presence_adu_q_1", "1a") === '1') {
            const surveyDateParts = (0, functionsCatalog_1.inputValue)("date", "1a").split("-");
            const surveyYear = Number(surveyDateParts[0]);
            const diabetesStartAge = (0, functionsCatalog_1.inputValue)("diabetes_startage_adu_q_1", "1a");
            const age = (0, functionsCatalog_1.inputValue)("age", "1a");
            if (diabetesStartAge !== undefined && age != undefined) {
                const surveyAge = Number((0, functionsCatalog_1.inputValue)("age", "1a"));
                return (surveyYear - surveyAge + Number(diabetesStartAge)).toString();
            }
            else {
                return undefined;
            }
        }
        else {
            const result = findDatesBetweenDiabetesPresenceReport();
            if (result != undefined) {
                const [date1, date2] = result;
                return (0, lifelinesFunctions_1.lifelinesDateToISO)((0, lifelinesFunctions_1.lifelinesMeanDate)(date1, date2));
            }
            else {
                return undefined;
            }
        }
    },
    verificationStatus: function () {
        return (0, codesCollection_1.getSNOMEDCode)("UNK");
    },
    code: function () {
        return (0, exports.determineDiabetesTypeCode)();
    }
};
/**
 * Memoized function for clinicalStatus
 */
const _clinicalStatus = (0, moize_1.default)((diab_presence, followup_assessments) => {
    if (diab_presence === "1") {
        return (0, codesCollection_1.getSNOMEDCode)("55561003");
    }
    else if (Object.values(followup_assessments).some((wavereading) => wavereading === "1")) {
        return (0, codesCollection_1.getSNOMEDCode)("55561003");
    }
    else {
        return undefined;
    }
});
/*
 *
 * Helper function for 'onsetDateTime'
 *
 * @param diabFollowUp
 *
 * @return
 *      If the date of the assessment where diabetes_followup_adu_q_1 = yes is available =>
 *          mean date between that particular date (when diabetes_followup_adu_q_1 = yes), and the date of the preceding assessment.
 *      Else
 *          return undefined date
 *
 * @precondition: there is at least one 'yes'/1 on diabetes_followup_adu_q_1
 * @precondition there is always a date on one of the assessment prior to the one where diabetes_followup_adu_q_1 was 'yes'
 *
 */
function findDatesBetweenDiabetesPresenceReport() {
    const diabFollowUp = (0, functionsCatalog_1.inputValues)('diabetes_followup_adu_q_1');
    //find the first positive report on diabetes_followup_adu_q_1, and its corresponding date
    const diabetesRepWave = Object.keys(diabFollowUp).find((key) => diabFollowUp[key] === '1');
    (0, unexpectedInputException_1.assertIsDefined)(diabetesRepWave, `A 'yes' value on diabetes_followup_adu_q_1 was expected`);
    const diabetesRepWaveDate = (0, functionsCatalog_1.inputValue)("date", diabetesRepWave);
    if (diabetesRepWaveDate === undefined) {
        return undefined;
    }
    else {
        //find the previous non-undefined assessment date
        const assessmentDates = (0, functionsCatalog_1.inputValues)('date');
        const waves = ['1a', '1b', '1c', '2a', '3a', '3b'];
        const previousWaves = waves.slice(0, waves.indexOf(diabetesRepWave));
        const previousAssessmentWave = previousWaves.reverse().find((pwave) => assessmentDates[pwave] !== undefined);
        (0, unexpectedInputException_1.assertIsDefined)(previousAssessmentWave, `Assessment (with a defined date) expected to exist previous to the one where diabetes_followup_adu_q_1 is reported`);
        const previousAssessmentDate = assessmentDates[previousAssessmentWave];
        return [previousAssessmentDate, diabetesRepWaveDate];
    }
}
/**
 *                              [1A][1B][1C][2A][3A][3B]
 * diabetes_type_adu_q_1        [X ][  ][  ][  ][  ][  ] what type of diabetes do you have? (1) type 1, (2) type 2, (3) other type, (4) I do not know
 * diabetes_type_adu_q_1_a      [X ][  ][  ][  ][  ][  ] another type of diabetes
 * t1d_followup_adu_q_1         [  ][  ][  ][X ][X ][X ] did the health problems listed below start since the last time
 * t2d_followup_adu_q_1         [  ][  ][  ][X ][X ][X ] did the health problems listed below start since the last time
 * diabetes_presence_adu_q_1    [X ][  ][  ][  ][  ][  ]
 * diabetes_followup_adu_q_1    [  ][X ][X ][X ][X ][X ]
 *
 * @precondition
 *      - the problem is 'active' (see clinicalStatus function)
 *      - there are no 'yes' values in both t1d_followup_adu_q_1 and t1d_followup_adu_q_2 (the two types of diabetes are mutually exclusive)
 *      - if there is a yes in 'diabetes_presence_adu_q_1', there should be a value in 'diabetes_type_adu_q_1'
 *
 * @pairingrule
 *      if diabetes_presence_adu_q_1[1A] is 'yes', and diabetes_type_adu_q_1 is either 1 or 2 => corresponding SNOMED diabetes type code
 *      else if diabetes_presence_adu_q_1[1A] is 'yes', and diabetes_type_adu_q_1 is neither 1 or 2 => **UNDEFINED** (see @questions)
 *      else
 *          if there is a 'yes' in t1d_followup_adu_q_1 => SNOMED code for diabates type 1
 *          else if there is a 'yes' in t2d_followup_adu_q_1 or  => SNOMED-diabates type 2
 *          else (there is a yes in diabetes_followup_adu_q_1, but not on neither t1d_followup_adu_q_1 nor t2d_followup_adu_q_1)
 *              We assign the parent code for Diabetes Mellitus (73211009) as a sort of Diabetes, unspecified.
 *
 */
const determineDiabetesTypeCode = () => {
    if ((0, functionsCatalog_1.inputValue)('diabetes_presence_adu_q_1', "1a") === '1') {
        const diabetesType = (0, functionsCatalog_1.inputValue)('diabetes_type_adu_q_1', "1a");
        //"1","type 1 (juvenile diabetes, usually since childhood)","type 1 (jeugddiabetes, meestal van kinds af aan)"
        if (diabetesType === '1')
            return (0, codesCollection_1.getSNOMEDCode)("46635009");
        //"2","type 2 (adult-onset diabetes, usually started at a later age)","type 2 (ouderdomsdiabetes, meestal op latere leeftijd)"
        else if (diabetesType === '2')
            return (0, codesCollection_1.getSNOMEDCode)("44054006");
        //"3","other type:","andere vorm, nl."
        else if (diabetesType === '3') {
            /**
             * To be defined (Issue #2)
             *
             * TODO: re-code open ended values from diabetes_type_adu_q_1_a
             */
            //const otherType = inputValue('diabetes_type_adu_q_1_a',"1a")                        
            return (0, codesCollection_1.getSNOMEDCode)("73211009");
        }
        //"4","i do not know","weet ik niet"
        //missing value
        else {
            return (0, codesCollection_1.getSNOMEDCode)("73211009");
        }
    }
    else {
        const t1dfollowup = (0, functionsCatalog_1.inputValues)("t1d_followup_adu_q_1");
        if (Object.values(t1dfollowup).some((wavereading) => wavereading === "1")) {
            return (0, codesCollection_1.getSNOMEDCode)("46635009");
        }
        else {
            const t2dfollowup = (0, functionsCatalog_1.inputValues)("t2d_followup_adu_q_1");
            if (Object.values(t2dfollowup).some((wavereading) => wavereading === "1")) {
                return (0, codesCollection_1.getSNOMEDCode)("44054006");
            }
            else {
                //return unidentified diabetes type (https://github.com/MyDigiTwinNL/CDF2Medmij-Mapping-tool/issues/23#issuecomment-2357954979)
                return (0, codesCollection_1.getSNOMEDCode)("73211009");
            }
        }
    }
};
exports.determineDiabetesTypeCode = determineDiabetesTypeCode;
//# sourceMappingURL=Diabetes.js.map
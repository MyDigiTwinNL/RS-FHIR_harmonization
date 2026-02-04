"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stroke = void 0;
const moize_1 = __importDefault(require("moize"));
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
exports.stroke = {
    conditionName: function () {
        return "stroke";
    },
    /**
     * It is present if the clinical status is 'active' (SNOMED 55561003)
     */
    isPresent: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("stroke_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("stroke_followup_adu_q_1")) === (0, codesCollection_1.getSNOMEDCode)("55561003");
    },
    /* Related variables:
    * ------------------------------------------------------------------
    *                                [1A][1B][1C][2A][3A][3B]
    * stroke_presence_adu_q_1        [X ][  ][  ][  ][  ][  ]
    * stroke_followup_adu_q_1        [  ][X ][X ][X ][X ][X ]
    * ------------------------------------------------------------------
    *
    * @precondition
    *      - no missing values
    *
    * @pairingrule
    *      if stroke_presence_adu_q_1 = yes in 1A => SNOMED code for active (55561003).
    *      else
    *          if stroke_presence_adu_q_1 = no, and there is a 'yes' on stroke_followup_adu_q_1 in any of the
    *          follow-up assessments => active.
    *          else
    *              undefined, as there is no such a thing as 'inactive' stroke given the
    *              definition used by the profile: Problems with the status 'Inactive' refer to problems that don't
    *              affect the patient anymore or that of which there is no evidence of existence anymore.
    */
    clinicalStatus: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("stroke_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("stroke_followup_adu_q_1"));
    },
    /**
     *
     * Related variables:
     * ------------------------------------------------------------------
     *                                [1A][1B][1C][2A][3A][3B]
     * stroke_startage_adu_q_1        [X ][  ][  ][  ][  ][  ]
     * stroke_presence_adu_q_1        [X ][  ][  ][  ][  ][  ]
     * stroke_followup_adu_q_1        [  ][X ][X ][X ][X ][X ]
     * date                           [X ][X ][X ][X ][X ][X ]
     * ------------------------------------------------------------------
     *
     * @precondition
     *      - date and age are not missing values (undefined)
     *      - the problem is 'active' (see clinicalStatus function)
     *
     * @pairingrule
     *      if stroke_presence_adu_q_1 = yes in 1A =>
     *              if start_age was reported, approximate year of the event given start_age reported (stroke_startage_adu_q_1)
     *                  and the year of the year of the assessment.
     *              else
     *                  undefined onset date
     *      else
     *          if there is a 'yes' in any stroke_followup_adu_q_1 =>
     *              If the date of the assessment where stroke_followup_adu_q_1 = yes is available =>
     *                  mean date between that particular date (when stroke_followup_adu_q_1 = yes), and the date of the preceding assessment.
     *              Else
     *                  return undefined date
     *          else
     *              error/precondition violated ('stroke' is not 'active' if the execution reached this point)
     *
     */
    onsetDateTime: function () {
        const firstAssessmentDate = (0, functionsCatalog_1.inputValue)("date", "1a");
        (0, unexpectedInputException_1.assertIsDefined)(firstAssessmentDate, 'non-null date expected for assessment 1a');
        //if (firstAssessmentDate==undefined) throw new UnexpectedInputException('non-null date expected for assessment 1a (TobaccoUse/smokingStart)');
        const firstAssessmentAge = (0, functionsCatalog_1.inputValue)("age", "1a");
        if ((0, functionsCatalog_1.inputValue)("stroke_presence_adu_q_1", "1a") === '1') {
            const surveyDateParts = firstAssessmentDate.split("-");
            const surveyYear = Number(surveyDateParts[0]);
            const strokeStartAge = (0, functionsCatalog_1.inputValue)("stroke_startage_adu_q_1", "1a");
            if (strokeStartAge !== undefined && firstAssessmentAge !== undefined) {
                const surveyAge = Number((0, functionsCatalog_1.inputValue)("age", "1a"));
                return (surveyYear - surveyAge + Number(strokeStartAge)).toString();
            }
            else {
                return undefined;
            }
        }
        else {
            const timeInterval = findDatesBetweenStrokePresenceReport();
            if (timeInterval != undefined) {
                const [date1, date2] = timeInterval;
                return (0, lifelinesFunctions_1.lifelinesDateToISO)((0, lifelinesFunctions_1.lifelinesMeanDate)(date1, date2));
            }
            else {
                return undefined;
            }
        }
    },
    /**
     * Verification status is undefined (SNOMED - UNK)
     */
    verificationStatus: function () {
        return (0, codesCollection_1.getSNOMEDCode)("UNK");
    },
    /**
     *
     * @returns SNOMED code for cerebro vascular accident - 230690007
     * Parents: Cardiovascular injury (disorder)
     *          Cerebrovascular disease (disorder)
     *          Lesion of brain (disorder)
     *          Traumatic or nontraumatic brain injury (disorder)
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)("230690007");
    },
};
/**
 * Memoized function for clinicalStatus
 */
const _clinicalStatus = (0, moize_1.default)((stroke_presence, followup_assessments) => {
    if (stroke_presence === "1") {
        return (0, codesCollection_1.getSNOMEDCode)("55561003");
    }
    else if (Object.values(followup_assessments).some((wavereading) => wavereading === "1")) {
        return (0, codesCollection_1.getSNOMEDCode)("55561003");
    }
    else {
        return undefined;
    }
});
/**
 * Helper function for 'onsetDateTime'
 *                                [1a][1b][1c][2a][3a][3b]
 * stroke_followup_adu_q_1        [  ][X ][X ][X ][X ][X ]
 * date                           [X ][X ][X ][X ][X ][X ]
 *
 *
 * mean date between the date of the assessment
 *              where stroke_followup_adu_q_1 = yes, and the date of the preceding one.
 *
 *
 * If the date of the assessment where stroke_followup_adu_q_1 = yes is available =>
 *      mean date between that particular date (when stroke_followup_adu_q_1 = yes), and the date of the preceding assessment.
 * Else
 *      return undefined date
 *
 * @param diabFollowUp
 * @returns
 */
function findDatesBetweenStrokePresenceReport() {
    const strokeFollowUp = (0, functionsCatalog_1.inputValues)('stroke_followup_adu_q_1');
    //find the first positive report on stroke_followup_adu_q_1, and its corresponding date
    const strokeWave = Object.keys(strokeFollowUp).find((key) => strokeFollowUp[key] === '1');
    (0, unexpectedInputException_1.assertIsDefined)(strokeWave, `A 'yes' value on stroke_followup_adu_q_1 was expected`);
    const strokeWaveDate = (0, functionsCatalog_1.inputValue)("date", strokeWave);
    if (strokeWaveDate === undefined) {
        return undefined;
    }
    else {
        //find the previous non-undefined assessment date
        const assessmentDates = (0, functionsCatalog_1.inputValues)('date');
        const waves = ['1a', '1b', '1c', '2a', '3a', '3b'];
        const previousWaves = waves.slice(0, waves.indexOf(strokeWave));
        const previousAssessmentWave = previousWaves.reverse().find((pwave) => assessmentDates[pwave] !== undefined);
        (0, unexpectedInputException_1.assertIsDefined)(previousAssessmentWave, `Assessment (with a non-null date) expected to exist previous to the one where stroke_followup_adu_q_1 is reported`);
        const previousAssessmentDate = assessmentDates[previousAssessmentWave];
        return [previousAssessmentDate, strokeWaveDate];
    }
}
//# sourceMappingURL=Stroke.js.map
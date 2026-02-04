"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myocardialInfarction = void 0;
const moize_1 = __importDefault(require("moize"));
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const functionsCatalog_1 = require("../functionsCatalog");
const codesCollection_1 = require("../codes/codesCollection");
const unexpectedInputException_1 = require("../unexpectedInputException");
exports.myocardialInfarction = {
    conditionName: function () {
        return 'MI';
    },
    isPresent: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("heartattack_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("heartattack_followup_adu_q_1")) === (0, codesCollection_1.getSNOMEDCode)("55561003");
    },
    /* Related variables:
    * ------------------------------------------------------------------
    *                                [1A][1B][1C][2A][3A][3B]

    * heartattack_presence_adu_q_1:  [X ][  ][  ][  ][  ][  ]
    * heartattack_followup_adu_q_1:  [  ][X ][X ][X ][X ][X ]
    * ------------------------------------------------------------------
    *
    * @precondition
    *      - no missing values
    *
    * @pairingrule
    *      if heartattack_presence_adu_q_1 = yes in 1A => SNOMED code for active (55561003).
    *      else
    *          if heartattack_presence_adu_q_1 = no, and there is a 'yes' on heartattack_followup_adu_q_1 in any of the
    *          follow-up assessments => active.
    *          else
    *              undefined, as there is no such a thing as 'inactive' heartattack given the
    *              definition used by the profile: Problems with the status 'Inactive' refer to problems that don't
    *              affect the patient anymore or that of which there is no evidence of existence anymore.
    */
    clinicalStatus: function () {
        return _clinicalStatus((0, functionsCatalog_1.inputValue)("heartattack_presence_adu_q_1", "1a"), (0, functionsCatalog_1.inputValues)("heartattack_followup_adu_q_1"));
    },
    /**
     *
     * Related variables:
     * ------------------------------------------------------------------
     *                                [1A][1B][1C][2A][3A][3B]
     * heartattack_startage_adu_q_1   [X ][  ][  ][  ][  ][  ]
     * heartattack_presence_adu_q_1   [X ][  ][  ][  ][  ][  ]
     * heartattack_followup_adu_q_1   [  ][X ][X ][X ][X ][X ]
     * date                           [X ][X ][X ][X ][X ][X ]
     * ------------------------------------------------------------------
     *
     * @precondition
     *      - date and age are not missing values (undefined)
     *      - the problem is 'active' (see clinicalStatus function)
     *
     * @pairingrule
     *      if heartattack_presence_adu_q_1 = yes in 1A =>
     *              if start_age was reported, approximate year of the event given start_age reported (heartattack_startage_adu_q_1)
     *                  and the year of the year of the assessment.
     *              else
     *                  undefined onset date
     *      else
     *          if there is a 'yes' in any heartattack_followup_adu_q_1 =>
     *              If the date of the assessment where heartattack_followup_adu_q_1 = yes is available =>
     *                  mean date between that particular date (when heartattack_followup_adu_q_1 = yes), and the date of the preceding assessment.
     *              Else
     *                  return undefined date
     *          else
     *              error/precondition violated ('heartattack' is not 'active' if the execution reached this point)
     *
     *
     */
    onsetDateTime: function () {
        const firstAssessmentDate = (0, functionsCatalog_1.inputValue)("date", "1a");
        (0, unexpectedInputException_1.assertIsDefined)(firstAssessmentDate, 'non-null date expected for assessment 1a');
        //if (firstAssessmentDate==undefined) throw new UnexpectedInputException('non-null date expected for assessment 1a (TobaccoUse/smokingStart)');
        const firstAssessmentAge = (0, functionsCatalog_1.inputValue)("age", "1a");
        if ((0, functionsCatalog_1.inputValue)("heartattack_presence_adu_q_1", "1a") === '1') {
            const surveyDateParts = firstAssessmentDate.split("-");
            const surveyYear = Number(surveyDateParts[0]);
            const heartattackStartAge = (0, functionsCatalog_1.inputValue)("heartattack_startage_adu_q_1", "1a");
            if (heartattackStartAge !== undefined && firstAssessmentAge !== undefined) {
                const surveyAge = Number((0, functionsCatalog_1.inputValue)("age", "1a"));
                return (surveyYear - surveyAge + Number(heartattackStartAge)).toString();
            }
            else {
                return undefined;
            }
        }
        else {
            const timeInterval = findDatesBetweenheartattackPresenceReport();
            if (timeInterval != undefined) {
                const [date1, date2] = timeInterval;
                return (0, lifelinesFunctions_1.lifelinesDateToISO)((0, lifelinesFunctions_1.lifelinesMeanDate)(date1, date2));
            }
            else {
                undefined;
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
     * @returns SNOMED code for myocardial infarction
     * Parents: Ischemic heart disease (disorder)
     *          Myocardial necrosis (disorder)
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)("22298006");
    },
};
/**
 * Memoized function for clinicalStatus
 */
const _clinicalStatus = (0, moize_1.default)((heartattack_presence, followup_assessments) => {
    if (heartattack_presence === "1") {
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
 * heartattack_followup_adu_q_1   [  ][X ][X ][X ][X ][X ]
 * date                           [X ][X ][X ][X ][X ][X ]
 *
 *
 * mean date between the date of the assessment
 *              where heartattack_followup_adu_q_1 = yes, and the date of the preceding one.
 *
 *
 * @param diabFollowUp
 * @returns
 */
function findDatesBetweenheartattackPresenceReport() {
    const heartattackFollowUp = (0, functionsCatalog_1.inputValues)('heartattack_followup_adu_q_1');
    //find the first positive report on heartattack_followup_adu_q_1, and its corresponding date
    const heartattackWave = Object.keys(heartattackFollowUp).find((key) => heartattackFollowUp[key] === '1');
    (0, unexpectedInputException_1.assertIsDefined)(heartattackWave, `A 'yes' value on heartattack_followup_adu_q_1 was expected`);
    const heartattackWaveDate = (0, functionsCatalog_1.inputValue)("date", heartattackWave);
    //If the date of the assessment where the episode was reported is not available, return undefined date
    if (heartattackWaveDate === undefined) {
        return undefined;
    }
    else {
        //find the previous non-undefined assessment date
        const assessmentDates = (0, functionsCatalog_1.inputValues)('date');
        const waves = ['1a', '1b', '1c', '2a', '3a', '3b'];
        const previousWaves = waves.slice(0, waves.indexOf(heartattackWave));
        const previousAssessmentWave = previousWaves.reverse().find((pwave) => assessmentDates[pwave] !== undefined);
        (0, unexpectedInputException_1.assertIsDefined)(previousAssessmentWave, `Assessment (with a non-null date) expected to exist previous to the one where heartattack_followup_adu_q_1 is reported`);
        const previousAssessmentDate = assessmentDates[previousAssessmentWave];
        return [previousAssessmentDate, heartattackWaveDate];
    }
}
//# sourceMappingURL=MyocardialInfarction.js.map
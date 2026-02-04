"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.results = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * Check if a given assessment was missed.
 * It is assumed (from Lifelines data analysis) that when 'date' is missing in an assessment, the
 * participant dropped the study or missed the assessment.
 * @param wave
 * @returns true if the assessment was missed
 */
const missedAsssesment = (wave) => (0, functionsCatalog_1.inputValue)("date", wave) === undefined;
/**
 * Check that a non-missed assessment lacks the basic information required to
 * create the resource. In this case, this happens when ever_smoker_adu_c_2
 * or ex_smoker_adu_c_2  are undefined. According to the data analysis on Lifelines data, when
 * the former is missing, the latter is also always missing.
 *
 * @param wave
 * @returns
 */
const essentialDataMissed = (wave) => (0, functionsCatalog_1.inputValue)("ever_smoker_adu_c_2", wave) === undefined;
/**
 *
 * @returns
 */
const results = function () {
    //Lifelines tobacco use derivatives do not include 3B
    const waves = ["1a", "1b", "1c", "2a", "2b", "3a"];
    //if the assessment was missed, do not create the resource
    return waves.filter((wave) => !missedAsssesment(wave) && !essentialDataMissed(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
        "assessment": wave,
        "useStatus": tobaccoUseStatus(wave),
        "amountPerDay": amountPerDay(wave),
        "packYears": packYears(wave),
        "smokingStartDate": smokingStart(wave),
        "smokingEndDate": smokingEnd(wave),
        "everSmoker": everSmoker(wave),
        "exSmoker": exSmoker(wave)
    }));
};
exports.results = results;
/**
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][2B][3A][3B]
 * ever_smoker_adu_c_2            [X ][X ][X ][X ][X ][X ][  ]
 *
 * @precondition ever_smoker_adu_c_2 is not undefined
 *
 */
const everSmoker = function (wave) {
    const eversmk = (0, functionsCatalog_1.inputValue)("ever_smoker_adu_c_2", wave);
    (0, unexpectedInputException_1.assertIsDefined)(eversmk, `Expected non-null value on ever_smoker_adu_c_2`);
    return eversmk === "1";
};
/**
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][2B][3A][3B]
 * ex_smoker_adu_c_2              [X ][X ][X ][X ][X ][X ][  ]
 *
 * @precondition ex_smoker_adu_c_2 is not undefined
 *
 *
 */
const exSmoker = function (wave) {
    const exSmoker = (0, functionsCatalog_1.inputValue)("ex_smoker_adu_c_2", wave);
    (0, unexpectedInputException_1.assertIsDefined)(exSmoker, `Expected non-null value on ex_smoker_adu_c_2`);
    return exSmoker === "1";
};
/**
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][2B][3A][3B]
 * smoking_startage_adu_c_2       [X ][X ][X ][X ][X ][X ][  ]
 * age                            [X ][  ][  ][  ][  ][  ][  ]
 *
 * @precondition
 *      - no missing values in date in the given wave
 *
 * @pairingrule
 *      - the approximate year the participant had the age reported in A1 baseline assessment,
 *        given the date such baseline assessment was performed
 */
const smokingStart = (wave) => {
    const assessmentDate = (0, functionsCatalog_1.inputValue)("date", "1a");
    (0, unexpectedInputException_1.assertIsDefined)(assessmentDate, 'non-null date expected for assessment 1a (TobaccoUse/smokingStart)');
    const partAge = (0, functionsCatalog_1.inputValue)("age", "1a");
    const smokingStartAge = (0, functionsCatalog_1.inputValue)("smoking_startage_adu_c_2", wave);
    if (smokingStartAge != undefined && partAge != undefined) {
        const surveyDateParts = assessmentDate.split("-");
        const surveyYear = Number(surveyDateParts[0]);
        const startAge = Number(smokingStartAge);
        //Age is only on baseline assessment 1A
        const surveyAge = Number(partAge);
        return (surveyYear - surveyAge + startAge).toString();
    }
    else {
        return undefined;
    }
};
/**
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][2B][3A][3B]
 * smoking_endage_adu_c_2         [X ][X ][X ][X ][X ][X ][  ]
 * age                            [X ][  ][  ][  ][  ][  ][  ]
 *
 */
const smokingEnd = (wave) => {
    const assessmentDate = (0, functionsCatalog_1.inputValue)("date", "1a");
    (0, unexpectedInputException_1.assertIsDefined)(assessmentDate, 'non-null date expected for assessment 1a (TobaccoUse/smokingEnd)');
    const partAge = (0, functionsCatalog_1.inputValue)("age", "1a");
    const smokingEndAge = (0, functionsCatalog_1.inputValue)("smoking_endage_adu_c_2", wave);
    if (smokingEndAge !== undefined && partAge !== undefined) {
        const surveyDateParts = assessmentDate.split("-");
        const surveyYear = Number(surveyDateParts[0]);
        const endAge = Number(smokingEndAge);
        const surveyAge = Number(partAge);
        return (surveyYear - surveyAge + endAge).toString();
    }
    else {
        return undefined;
    }
};
/**
 * Type of toboacco is reported as undefined. Using it would require creating a FHIR resource for each type of tobbaco,
 * with its specific consuption. Consuption per type is not available in the smoking_derivatives.
 *
 * @param wave assessment for which the type of tobacco would be reported
 */
const typeOfTobaccoUsed = (wave) => {
    return undefined;
};
/**
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][2B][3A][3B]
 * ex_smoker_adu_c_2              [X ][X ][X ][X ][X ][X ][  ]
 * ever_smoker_adu_c_2            [X ][X ][X ][X ][X ][X ][  ]
 * current_smoker_adu_c_2         [X ][X ][X ][X ][X ][X ][  ]
 * ------------------------------------------------------------------
 *
 * The status of the result value.
 *
 * @return the SNOMED code corresponding to the related variables. If the related variables
 *         are undefined, returns 'other'
 *
 *         ***Note***: the Smoking derivatives variables do not follow the standard coding (1=yes, 2=no)
 *               Instead, yes = 1, no = 0.
 *
 *              "current_smoker_adu_c_2","0","no","nee"
 *              "ever_smoker_adu_c_2","0","no","nee"
 *              "ex_smoker_adu_c_2","0","no","nee"
 *
 * @param wave the code of the assessment for which the tobacco use status will be evaluated
 *
 * @question
 *
 */
const tobaccoUseStatus = (wave) => {
    if ((0, functionsCatalog_1.inputValue)("ever_smoker_adu_c_2", wave) === "0") {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.non_smoker;
    }
    else if ((0, functionsCatalog_1.inputValue)("ex_smoker_adu_c_2", wave) === "1") {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.ex_smoker;
    }
    else if ((0, functionsCatalog_1.inputValue)("current_smoker_adu_c_2", wave) === "1") {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.daily;
    }
    else {
        return snomedCodeLists_1.tobaccoUseStatusSNOMEDCodelist.other;
    }
};
/**
 * total_frequency_adu_c_1 total number smoked per day (all types except e-cigarettes)
 *
 *
 */
const amountPerDay = (wave) => {
    const apd = (0, functionsCatalog_1.inputValue)("total_frequency_adu_c_1", wave);
    return apd !== undefined ? Number(apd) : undefined;
};
/**
 * packyears_cumulative_adu_c_2 - packyears (cumuative smoking history)
 */
const packYears = (wave) => {
    const py = (0, functionsCatalog_1.inputValue)("packyears_cumulative_adu_c_2", wave);
    return py !== undefined ? Number(py) : undefined;
};
//# sourceMappingURL=TobaccoUse.js.map
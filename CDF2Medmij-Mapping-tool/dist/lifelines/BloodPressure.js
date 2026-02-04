"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectedDateTime = exports.arterialBloodPressure = exports.diastolicBloodPressure = exports.systolicBloodPressure = exports.measuringLocation = exports.cuffType = exports.measuring_location_codeMapping = exports.results = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const manchetCodeLists_1 = require("../codes/manchetCodeLists");
const snomedCodeLists_1 = require("../codes/snomedCodeLists");
const unexpectedInputException_1 = require("../unexpectedInputException");
/**
 * It is assumed (from Lifelines data analysis) that when 'date' is missing in an assessment, the
 * participant dropped the study or missed the assessment.
 * @param wave
 * @returns true if the assessment was missed
 */
const missedAsssesment = (wave) => (0, functionsCatalog_1.inputValue)("date", wave) == undefined;
/**
 * HCIM BloodPressure:
 * The FHIR BloodPressure profile sets a minimum expectations for the Observation Resource to record,
 * search and fetch the blood pressure associated with a patient.
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * bpavg_systolic_all_m_1         [X ][  ][  ][X ][  ][  ]
 * bpavg_diastolic_all_m_1        [X ][  ][  ][X ][  ][  ]
 * bpavg_arterial_all_m_1         [X ][  ][  ][X ][  ][  ]
 * bp_entrytype_all_m_1           [X ][  ][  ][X ][  ][  ]
 * bp_bandsize_all_m_1            [X ][  ][  ][X ][X ][  ]
 * bp_arm_all_m_1                 [  ][  ][  ][  ][X ][  ]
 * date                           [X ][X ][X ][X ][X ][X ]
 * ------------------------------------------------------------------
 *
 *
 * @mappingrules
 *      - Two blood pressure measurements based on the systolic, diastolic and arterial readings from 1A and 2A
 *           "cuffType": Manchet code for bp_bandsize_all_m_1 value, in the corresponding assessment
 *           "measuringLocation": undefined *See question below
 *           "systolicBloodPressure": bpavg_systolic_all_m_1 value in the corresponding assesment
 *           "diastolicBloodPressure": bpavg_diastolic_all_m_1 value in the corresponding assesment
 *           "arterialBloodPressure": bpavg_arterial_all_m_1 value in the corresponding assesment
 *           "collectedDateTime": Date of the corresponding assessment
 * @question
 *      - The bp_arm_all_m_1 variable (Left or right arm?) was collected only in 3A. The blood pressure measurements
 *          were collected in 1A and 2A. How to interpret this? Which 'measuring location' should we use in this case?:
 *          The SOP states that blood pressure is measured on the right upper arm, barring any contra-indications.
 *          In case of a contra-indication, the left upper arm is used. Unfortunately, we don't know in which patients
 *          there is a contra-indication. Best practice might be to omit the measurement location in the wave we are
 *          uncertain about the location.
 *
 */
const results = function () {
    const waves = ["1a", "2a"];
    return waves.filter((wave) => !missedAsssesment(wave)).map((wave) => 
    //return the data through the 'checked access' proxy to prevent silent data-access errors in JSONata (e.g., a mispelled property)
    (0, functionsCatalog_1.createCheckedAccessProxy)({
        "assessment": wave,
        "cuffType": (0, exports.cuffType)(wave),
        "measuringLocation": undefined,
        "systolicBloodPressure": (0, exports.systolicBloodPressure)(wave),
        "diastolicBloodPressure": (0, exports.diastolicBloodPressure)(wave),
        "arterialBloodPressure": (0, exports.arterialBloodPressure)(wave),
        "collectedDateTime": (0, exports.collectedDateTime)(wave)
    }));
};
exports.results = results;
/**
 * Lifelines' Categorical values - SNOMED/Manchet codes mapping
*/
/*1: left arm*/
/*2: right arm*/
exports.measuring_location_codeMapping = {
    "1": snomedCodeLists_1.measuringLocationSNOMEDCodelist.left_upper_arm_structure,
    "2": snomedCodeLists_1.measuringLocationSNOMEDCodelist.right_upper_arm_structure
};
/*1:small adult cuff*/
/*2:medium adult cuff*/
/*3:large adult cuff*/
/*4:child cuff*/
/*5:thigh cuff (xl cuff)*/
const bp_bandsize_all_m_1_codeMapping = {
    "1": manchetCodeLists_1.cuffTypeManchetTypeCodeList.klein,
    "2": manchetCodeLists_1.cuffTypeManchetTypeCodeList.standard,
    "3": manchetCodeLists_1.cuffTypeManchetTypeCodeList.groot,
    "4": manchetCodeLists_1.cuffTypeManchetTypeCodeList.kind,
    "5": manchetCodeLists_1.cuffTypeManchetTypeCodeList.extra_groot
};
const cuffType = function (wave) {
    const bandsize = (0, functionsCatalog_1.inputValue)("bp_bandsize_all_m_1", wave);
    if (bandsize != undefined) {
        return bp_bandsize_all_m_1_codeMapping[bandsize];
    }
    else {
        return undefined;
    }
};
exports.cuffType = cuffType;
const measuringLocation = function (wave) {
    const lifelinesBpArmAll = (0, functionsCatalog_1.inputValue)("bp_arm_all_m_1", wave);
    if (lifelinesBpArmAll != undefined) {
        return exports.measuring_location_codeMapping[lifelinesBpArmAll];
    }
    else {
        return undefined;
    }
};
exports.measuringLocation = measuringLocation;
const systolicBloodPressure = function (wave) {
    const sysv = (0, functionsCatalog_1.inputValue)("bpavg_systolic_all_m_1", wave);
    if (sysv !== undefined) {
        return Number(sysv);
    }
    else {
        return undefined;
    }
};
exports.systolicBloodPressure = systolicBloodPressure;
const diastolicBloodPressure = function (wave) {
    const diav = (0, functionsCatalog_1.inputValue)("bpavg_diastolic_all_m_1", wave);
    if (diav !== undefined) {
        return Number(diav);
    }
    else {
        return undefined;
    }
};
exports.diastolicBloodPressure = diastolicBloodPressure;
const arterialBloodPressure = function (wave) {
    const artbpv = (0, functionsCatalog_1.inputValue)("bpavg_arterial_all_m_1", wave);
    if (artbpv !== undefined) {
        return Number(artbpv);
    }
    else {
        return undefined;
    }
};
exports.arterialBloodPressure = arterialBloodPressure;
/**
 *
 * @param wave
 * @precondition date column has never missing values
 * @returns collected date time
 */
const collectedDateTime = function (wave) {
    const date = (0, functionsCatalog_1.inputValue)("date", wave);
    (0, unexpectedInputException_1.assertIsDefined)(date, `Precondition failed - bloodpressure: missing date in assessment ${wave}`);
    return (0, lifelinesFunctions_1.lifelinesDateToISO)(date);
};
exports.collectedDateTime = collectedDateTime;
//# sourceMappingURL=BloodPressure.js.map
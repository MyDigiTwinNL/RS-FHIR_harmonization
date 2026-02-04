"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haemoglobinConcentration = void 0;
const functionsCatalog_1 = require("../functionsCatalog");
const lifelinesFunctions_1 = require("../lifelinesFunctions");
const codesCollection_1 = require("../codes/codesCollection");
/*
Based on HCIM Observation/ ZIB LaboratoryTestResult resource:
https://simplifier.net/packages/nictiz.fhir.nl.stu3.zib2017/2.2.13/files/2039136
https://zibs.nl/wiki/LaboratoryTestResult-v4.1(2017EN)

ADD URL OF THE VARIABLES DOCUMENTATION INVOLVED IN THE PAIRING RULES
Related Lifelines variables:
http://wiki.lifelines.nl/doku.php?id=blood_analyses
https://www.umcg.nl/bw/42976573-722a-48fc-a650-5ea718fd1717
*/
/**
 * A laboratory result describes the result of a laboratory analysis. These are specimen-oriented
 * tests as performed in laboratories such as Clinical Chemistry, Serology, Microbiology, etc.
 * In addition to the results of tests with a singular result, this concept can also contain
 * the results of more complex tests with multiple results or a ‘panel’.
 *
 *
 * Related variables:
 * ------------------------------------------------------------------
 *                                [1A][1B][1C][2A][3A][3B]
 * hemoglobin_result_all_m_1      [X ][  ][  ][X ][  ][  ]
 * date                           [X ][X ][X ][X ][X ][X ]
 * ------------------------------------------------------------------
 *
 * @return, for each assessment:
 *      [[assessment_N]:
 *          - result: hemoglobin_result_all_m_1 in assessment_N
 *          - resultcoding: {"system": "http://loinc.org","code": "718-7","display": "Hgb Bld-mCnc"}
 *          - resultunits: {"unit": "mmol/l","system": "http://unitsofmeasure.org","code": "mmol/L"}
 *          - resultFlag: if gender == male:
 *                            if hemoglobin_result_all_m_1 in assessment_N > 11.0 mmol/L:
 *                               {code:281302008, system:http://snomed.info/sct}
 *                            elif hemoglobin_result_all_m_1 in assessment_N < 8.5 mmol/L:
 *                               {code:281300000, system:http://snomed.info/sct}
 *                        elif gender == female:
 *                            if hemoglobin_result_all_m_1 in assessment_N > 10.0 mmol/L:
 *                               {code:281302008, system:http://snomed.info/sct}
 *                            elif hemoglobin_result_all_m_1 in assessment_N < 7.5 mmol/L:
 *                               {code:281300000, system:http://snomed.info/sct}
 *          - collectedDateTime: date of assessment_N
 *
 */
exports.haemoglobinConcentration = {
    referenceRangeUpperLimit: function () {
        return undefined;
    },
    referenceRangeLowerLimit: function () {
        return undefined;
    },
    diagnosticCategoryCoding: function () {
        //laboratory_report,microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        //"718-7" - "Hgb Bld-mCnc"
        return [(0, codesCollection_1.getLOINCCode)('718-7')];
    },
    diagnosticCodeText: function () {
        return "Hemoglobin [Mass/volume] in Blood";
    },
    observationCategoryCoding: function () {
        //"Laboratory test finding (finding)","display": "Serum chemistry test"
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        //"718-7" - "Hgb Bld-mCnc"
        return [(0, codesCollection_1.getLOINCCode)('718-7')];
    },
    resultUnit: function () {
        //*"mmol/l
        return (0, codesCollection_1.getUCUMCode)("mmol/L");
    },
    results: function () {
        const waves = ["1a", "2a"];
        //if the assessment was missed, do not evaluate/create the resource
        return waves.filter((wave) => !(0, lifelinesFunctions_1.assesmentMissed)(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            "assessment": wave,
            "resultFlags": resultFlag(wave),
            "testResult": function () {
                const hemoglobin = (0, functionsCatalog_1.inputValue)("hemoglobin_result_all_m_1", wave);
                return hemoglobin !== undefined ? Number(hemoglobin) : undefined;
            }(),
            "collectedDateTime": (0, lifelinesFunctions_1.collectedDateTime)(wave)
        }));
    },
    labTestName: function () {
        return "Haemoglob";
    }
};
/**
 * Result flag calculation for Haemoglobin concentration
 * @param wave
 * @returns SNOMED code for above/below limit
 */
const resultFlag = (wave) => {
    // Gender only available on '1a'
    const gender = (0, functionsCatalog_1.inputValue)("gender", "1a");
    const hemoglobin = (0, functionsCatalog_1.inputValue)("hemoglobin_result_all_m_1", wave);
    if (gender === undefined || hemoglobin === undefined) {
        return undefined;
    }
    else {
        if (gender == "MALE") {
            if (Number(hemoglobin) > 11.0) {
                return (0, codesCollection_1.getSNOMEDCode)('281302008');
            }
            else if (Number(hemoglobin) < 8.5) {
                return (0, codesCollection_1.getSNOMEDCode)('281300000');
            }
            else {
                return undefined;
            }
        }
        else {
            if (Number(hemoglobin) > 10.0) {
                return (0, codesCollection_1.getSNOMEDCode)('281302008');
            }
            else if (Number(hemoglobin) < 7.5) {
                return (0, codesCollection_1.getSNOMEDCode)('281300000');
            }
            else {
                return undefined;
            }
        }
    }
};
//# sourceMappingURL=HaemoglobinConcentration.js.map
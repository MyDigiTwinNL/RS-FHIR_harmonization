"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hbA1c = void 0;
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
https://www.umcg.nl/bw/a20a8160-9c17-4866-a9eb-191dddb43d8b
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
 * hba1cconc_result_all_m_1       [X ][  ][  ][X ][  ][  ]
 * date                           [X ][X ][X ][X ][X ][X ]
 * ------------------------------------------------------------------
 *
 * @return, for each assessment:
 *      [[assessment_N]:
 *          - result: hba1cconc_result_all_m_1 in assessment_N
 *          - resultcoding: {"system": "http://loinc.org","code": "4548-4","display": "HbA1c MFr Bld"}
 *          - resultunits: {"unit": "mmol/mol","system": "http://unitsofmeasure.org","code": "mmol/mol"}
 *          - resultFlag: {code:281302008, system:http://snomed.info/sct} if
 *              hba1cconc_result_all_m_1 in assessment_N > 42 mmol/mol
 *          - collectedDateTime: date of assessment_N
 *
 */
exports.hbA1c = {
    labTestName: function () {
        return 'HbA1c';
    },
    referenceRangeUpperLimit: function () {
        return HBA1C_UPPER_LIMIT;
    },
    referenceRangeLowerLimit: function () {
        return undefined;
    },
    diagnosticCategoryCoding: function () {
        //laboratory_report,microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        //HbA1c MFr Bld
        return [(0, codesCollection_1.getLOINCCode)('4548-4')];
    },
    diagnosticCodeText: function () {
        return "Cholesterol in HDL [Moles/volume] in Serum or Plasma";
    },
    observationCategoryCoding: function () {
        //"Laboratory test finding (finding)", "Serum chemistry test"
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    observationCodeCoding: function () {
        //HbA1c MFr Bld
        return [(0, codesCollection_1.getLOINCCode)('4548-4')];
    },
    resultUnit: function () {
        return (0, codesCollection_1.getUCUMCode)('mmol/mol');
    },
    results: function () {
        const waves = ["1a", "2a"];
        //if the assessment was missed, do not evaluate/create the resource
        return waves.filter((wave) => !(0, lifelinesFunctions_1.assesmentMissed)(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            "assessment": wave,
            "resultFlags": resultFlag(wave),
            "testResult": function () {
                const hba1c = (0, functionsCatalog_1.inputValue)("hba1cconc_result_all_m_1", wave);
                return hba1c !== undefined ? Number(hba1c) : undefined;
            }(),
            "collectedDateTime": (0, lifelinesFunctions_1.collectedDateTime)(wave)
        }));
    }
};
const HBA1C_UPPER_LIMIT = 42;
const resultFlag = (wave) => {
    const hba1cresult = (0, functionsCatalog_1.inputValue)('hba1cconc_result_all_m_1', wave);
    if (hba1cresult !== undefined && Number(hba1cresult) > HBA1C_UPPER_LIMIT) {
        return (0, codesCollection_1.getSNOMEDCode)('281302008');
    }
    else {
        return undefined;
    }
};
//# sourceMappingURL=HbA1c.js.map
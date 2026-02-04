"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plasmaAlbumin = void 0;
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
https://www.umcg.nl/bw/503e8554-bf74-47c9-b175-9fc3792ba9b4
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
 * albumin_result_all_m_1         [X ][  ][  ][  ][  ][  ]
 * date                           [X ][X ][X ][X ][X ][X ]
 * ------------------------------------------------------------------
 *
 * @return, for each assessment:
 *      [[assessment_N]:
 *          - result: albumin_result_all_m_1 in assessment_N
 *          - resultcoding: {"system": "http://loinc.org","code": "1751-7","display": "Albumin SerPl-mCnc"}
 *          - resultunits: {"unit": "g/l","system": "http://unitsofmeasure.org","code": "g/L"}
 *          - resultFlag:
 *               {code:281302008, system:http://snomed.info/sct} if
 *                  albumin_result_all_m_1 in assessment_N > 50.0 g/l
 *               {code:281300000, system:http://snomed.info/sct} if
 *                  albumin_result_all_m_1 in assessment_N < 35.0 g/l
 *          - collectedDateTime: date of assessment_N
 *
 */
exports.plasmaAlbumin = {
    labTestName: function () {
        return "plasma-alb";
    },
    referenceRangeUpperLimit: function () {
        return PLASMA_ALBUMIN_REFERENCE_RANGE_UPPER_LIMIT;
    },
    referenceRangeLowerLimit: function () {
        return PLASMA_ALBUMIN_REFERENCE_RANGE_LOWER_LIMIT;
    },
    diagnosticCategoryCoding: function () {
        //laboratory_report,microbiology_procedure
        return [(0, codesCollection_1.getSNOMEDCode)('4241000179101'), (0, codesCollection_1.getSNOMEDCode)('19851009')];
    },
    diagnosticCodeCoding: function () {
        //1751-7:Albumin SerPl-mCnc
        return [(0, codesCollection_1.getLOINCCode)('1751-7')];
    },
    observationCodeCoding: function () {
        //1751-7:Albumin SerPl-mCnc
        return [(0, codesCollection_1.getLOINCCode)('1751-7')];
    },
    diagnosticCodeText: function () {
        return "Albumin [Mass/volume] in Serum or Plasma";
    },
    observationCategoryCoding: function () {
        //"Laboratory test finding (finding)","display": "Serum chemistry test"
        return [(0, codesCollection_1.getSNOMEDCode)('49581000146104'), (0, codesCollection_1.getSNOMEDCode)('275711006')];
    },
    resultUnit: function () {
        return (0, codesCollection_1.getUCUMCode)('g/L');
    },
    results: function () {
        const waves = ["1a"];
        //if the assessment was missed, do not evaluate/create the resource
        return waves.filter((wave) => !(0, lifelinesFunctions_1.assesmentMissed)(wave)).map((wave) => (0, functionsCatalog_1.createCheckedAccessProxy)({
            "assessment": wave,
            "resultFlags": resultFlag(wave),
            "testResult": function () {
                const albumin = (0, functionsCatalog_1.inputValue)("albumin_result_all_m_1", wave);
                return albumin !== undefined ? Number(albumin) : undefined;
            }(),
            "collectedDateTime": (0, lifelinesFunctions_1.collectedDateTime)(wave)
        }));
    }
};
const PLASMA_ALBUMIN_REFERENCE_RANGE_LOWER_LIMIT = 35;
const PLASMA_ALBUMIN_REFERENCE_RANGE_UPPER_LIMIT = 50;
const resultFlag = (wave) => {
    const albumin = (0, functionsCatalog_1.inputValue)("albumin_result_all_m_1", wave);
    if (albumin === undefined) {
        return undefined;
    }
    else {
        const albuminVal = Number(albumin);
        if (albuminVal > PLASMA_ALBUMIN_REFERENCE_RANGE_UPPER_LIMIT) {
            return (0, codesCollection_1.getSNOMEDCode)('281302008');
        }
        else if (albuminVal < PLASMA_ALBUMIN_REFERENCE_RANGE_LOWER_LIMIT) {
            return (0, codesCollection_1.getSNOMEDCode)('281300000');
        }
        else {
            return undefined;
        }
    }
};
//# sourceMappingURL=PlasmaAlbumin.js.map
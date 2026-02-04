"use strict";
/**
 * Based on https://build.fhir.org/researchsubject.html and
 *
 * https://hl7.org/fhir/STU3/researchstudy.html
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyStatus = void 0;
var StudyStatus;
(function (StudyStatus) {
    StudyStatus["DRAFT"] = "draft";
    StudyStatus["IN_PROGRESS"] = "in-progress";
    StudyStatus["SUSPENDED"] = "suspended";
    StudyStatus["STOPPED"] = "stopped";
    StudyStatus["COMPLETED"] = "completed";
    StudyStatus["ENTERED_IN_ERROR"] = "entered-in-error";
})(StudyStatus || (exports.StudyStatus = StudyStatus = {}));
//# sourceMappingURL=researchSubjectAndStudy.js.map
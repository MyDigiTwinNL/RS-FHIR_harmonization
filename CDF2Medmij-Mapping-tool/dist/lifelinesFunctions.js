"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.substractDates = exports.lifelinesMeanDate = exports.lifelinesDateToISO = exports.collectedDateTime = exports.assesmentMissed = exports.echo = exports.waveSpecificResourceId = exports.resourceId = void 0;
const functionsCatalog_1 = require("./functionsCatalog");
/**
 * The following general-purpose functions are not intended to be used directly, as
 * they are context-dependant (given which JSON document is being processed by
 * a JSONata expression).
 * These are loaded as'bindings' to each JSONata expression (see mapper module),
 * so that they can be called within the templates, or from the other loaded
 * modules.
 *
 */
const resourceId = (resourceName) => `${resourceName}-${(0, functionsCatalog_1.inputValue)('project_pseudo_id', "1a")}`;
exports.resourceId = resourceId;
const waveSpecificResourceId = (resourceName, wave) => `${resourceName}-${wave}-${(0, functionsCatalog_1.inputValue)('project_pseudo_id', '1a')}`;
exports.waveSpecificResourceId = waveSpecificResourceId;
const echo = (text) => (console.info(text));
exports.echo = echo;
/**
 *
 * It is assumed (from Lifelines data analysis) that when 'date' is missing in an assessment, the
 * participant dropped the study or missed the assessment.
 * @param wave
 * @returns true if the assessment was missed, for the
 */
const assesmentMissed = (wave) => (0, functionsCatalog_1.inputValue)("date", wave) == undefined;
exports.assesmentMissed = assesmentMissed;
/**
 *
 * @precondition date in the given wave is never undefined
 * @param wave
 * @returns
 */
const collectedDateTime = function (wave) {
    const coldate = (0, functionsCatalog_1.inputValue)("date", wave);
    if (coldate != undefined) {
        return (0, exports.lifelinesDateToISO)(coldate);
    }
    else {
        return undefined;
    }
};
exports.collectedDateTime = collectedDateTime;
/**
 * Output format based on: https://build.fhir.org/datatypes.html#dateTime
 */
const lifelinesDateToISO = (lifelinesdate) => {
    if (lifelinesdate === undefined)
        throw Error('Undefined parameter given to lifelinesDataToISO function. Expected string with the format YYYY-MM');
    const [year, month] = lifelinesdate.split('-').map((dpart) => parseInt(dpart));
    //Format YYYY-MM required, e.g., 2012-10, 2013-01
    return `${year}-${month < 10 ? "0" : ""}${month}`;
};
exports.lifelinesDateToISO = lifelinesDateToISO;
/**
 *
 * @param date1
 * @param date2
 * @returns The mean between date1 and date2 that follow the lifelines format
 * YYYY-M
 */
const lifelinesMeanDate = (date1, date2) => {
    const [year1, month1] = date1.split('-');
    const [year2, month2] = date2.split('-');
    const date1Obj = new Date(parseInt(year1), parseInt(month1) - 1);
    const date2Obj = new Date(parseInt(year2), parseInt(month2) - 1);
    const meanTimestamp = (date1Obj.getTime() + date2Obj.getTime()) / 2;
    const meanDate = new Date(meanTimestamp);
    const meanMonth = (meanDate.getMonth() + 1).toString();
    const meanYear = meanDate.getFullYear();
    return `${meanYear}-${meanMonth}`;
};
exports.lifelinesMeanDate = lifelinesMeanDate;
/**
 * Return the difference, in months, between to dates that follow Lifeline's format
 * YYYY-MM. To get a positive result, the earliest date should be given as the
 * first argument.
 *
 * @param date1
 * @param date2
 * @returns the difference
 */
const substractDates = (date1, date2) => {
    const [year1, month1] = date1.split('-').map(Number);
    const [year2, month2] = date2.split('-').map(Number);
    return (year2 - year1) * 12 + (month2 - month1);
};
exports.substractDates = substractDates;
//# sourceMappingURL=lifelinesFunctions.js.map
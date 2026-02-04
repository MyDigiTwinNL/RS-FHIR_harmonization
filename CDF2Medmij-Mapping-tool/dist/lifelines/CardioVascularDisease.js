"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardioVascularDisease = void 0;
const MyocardialInfarction_1 = require("./MyocardialInfarction");
const HeartFailure_1 = require("./HeartFailure");
const Stroke_1 = require("./Stroke");
const codesCollection_1 = require("../codes/codesCollection");
exports.cardioVascularDisease = {
    conditionName: function () {
        return 'CVD';
    },
    isPresent: function () {
        return Stroke_1.stroke.isPresent() || HeartFailure_1.heartFailure.isPresent() || MyocardialInfarction_1.myocardialInfarction.isPresent();
    },
    clinicalStatus: function () {
        const statuses = [Stroke_1.stroke.clinicalStatus(), HeartFailure_1.heartFailure.clinicalStatus(), MyocardialInfarction_1.myocardialInfarction.clinicalStatus()];
        const activeSNOMEDCode = (0, codesCollection_1.getSNOMEDCode)("55561003");
        if (statuses.some((condition) => condition === activeSNOMEDCode)) {
            return activeSNOMEDCode;
        }
        else {
            return undefined;
        }
    },
    /**
     * Return the earliest onsetdate of the active stroke, HF or MI conditions.
     *
     * @precondition stroke, HF or MI are active (there is no definition of 'onsetDateTime' for this case)
     * @returns
     */
    onsetDateTime: function () {
        const onsetDates = [];
        //onSetDateTime method fails if used on a condition that is not active
        if (Stroke_1.stroke.isPresent())
            onsetDates.push(Stroke_1.stroke.onsetDateTime());
        if (HeartFailure_1.heartFailure.isPresent())
            onsetDates.push(HeartFailure_1.heartFailure.onsetDateTime());
        if (MyocardialInfarction_1.myocardialInfarction.isPresent())
            onsetDates.push(MyocardialInfarction_1.myocardialInfarction.onsetDateTime());
        //The three conditions are not present, hence the CVD condition is not present and this method
        //shouldn't be invoked.
        if (onsetDates.length === 0) {
            throw Error("Failed precondition: requesting onsetDateTime on a CVD condition that is not active");
        }
        //filter undefined dates, and parse the remaining ones.
        const parsedDates = onsetDates.filter(date => date !== undefined)
            .map(date => {
            // (date with '!' as here is no longer possible for it to be undefined)
            const [year, month] = date.split('-');
            //An onset date for a condition may include only the year. This is the case when it is estimated from 
            //the reported start age, that is to say, when it was reported on the baseline assessment
            if (month === undefined) {
                return new Date(`${year}`);
            }
            else {
                return new Date(`${year}-${month}`);
            }
        });
        // If all the 'present' conditions have an undefined onset date, the CVD onset date is also undefined.
        if (parsedDates.length === 0) {
            return undefined;
        }
        // Find the earliest date
        let earliestDate = parsedDates[0];
        for (const date of parsedDates) {
            if (date < earliestDate) {
                earliestDate = date;
            }
        }
        // Convert the earliest Date object back to 'YYYY-MM' format
        return earliestDate.toISOString().slice(0, 7);
    },
    verificationStatus: function () {
        return (0, codesCollection_1.getSNOMEDCode)("UNK");
    },
    /**
     * @returns SNOMED code for
     *      Disorder of the circulatory system
     *      CVD - cardiovascular disease        - 49601007
     */
    code: function () {
        return (0, codesCollection_1.getSNOMEDCode)("49601007");
    }
};
//# sourceMappingURL=CardioVascularDisease.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inputSingleton_1 = require("../inputSingleton");
const HaemoglobinConcentration_1 = require("../lifelines/HaemoglobinConcentration");
test('Haemoglobine conceptration for male participant, above limit', () => {
    const input = {
        "hemoglobin_result_all_m_1": { "1a": "11.1", "2a": "12" }, //in mmol/L
        "gender": { "1a": "MALE" },
        "date": { /*date1*/ "1a": "1990-1", "1b": "1995-5", "1c": "1997-5", /*date2*/ "2a": "2000-1", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "40" }, //age on "2a": 50  
        "project_pseudo_id": { "1a": "520681571" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = HaemoglobinConcentration_1.haemoglobinConcentration.results();
    expect(results.length).toBe(2);
    expect(results[0].testResult).toBe(11.1);
    expect(results[0].resultFlags?.display).toBe("Above reference range");
    expect(results[1].testResult).toBe(12);
    expect(results[1].resultFlags?.display).toBe("Above reference range");
});
test('Haemoglobine conceptration for male participant, below reference range', () => {
    const input = {
        "hemoglobin_result_all_m_1": { "1a": "8", "2a": "8.4" }, //in mmol/L
        "gender": { "1a": "MALE" },
        "date": { /*date1*/ "1a": "1990-1", "1b": "1995-5", "1c": "1997-5", /*date2*/ "2a": "2000-1", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "40" }, //age on "2a": 50  
        "project_pseudo_id": { "1a": "520681571" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = HaemoglobinConcentration_1.haemoglobinConcentration.results();
    expect(results.length).toBe(2);
    expect(results[0].testResult).toBe(8);
    expect(results[0].resultFlags?.display).toBe("Below reference range");
    expect(results[1].testResult).toBe(8.4);
    expect(results[1].resultFlags?.display).toBe("Below reference range");
});
test('Haemoglobine conceptration for male participant, within the reference range (border cases)', () => {
    const input = {
        "hemoglobin_result_all_m_1": { "1a": "11", "2a": "8.5" }, //in mmol/L
        "gender": { "1a": "MALE" },
        "date": { /*date1*/ "1a": "1990-1", "1b": "1995-5", "1c": "1997-5", /*date2*/ "2a": "2000-1", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "40" }, //age on "2a": 50  
        "project_pseudo_id": { "1a": "520681571" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = HaemoglobinConcentration_1.haemoglobinConcentration.results();
    expect(results.length).toBe(2);
    expect(results[0].resultFlags).toBe(undefined);
    expect(results[1].resultFlags).toBe(undefined);
});
test('Haemoglobine conceptration for male participant, within the reference range ', () => {
    const input = {
        "hemoglobin_result_all_m_1": { "1a": "10", "2a": "9" }, //in mmol/L
        "gender": { "1a": "MALE" },
        "date": { /*date1*/ "1a": "1990-1", "1b": "1995-5", "1c": "1997-5", /*date2*/ "2a": "2000-1", "3a": "2003-5", "3b": "2005-5" },
        "age": { "1a": "40" }, //age on "2a": 50  
        "project_pseudo_id": { "1a": "520681571" },
    };
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const results = HaemoglobinConcentration_1.haemoglobinConcentration.results();
    expect(results.length).toBe(2);
    expect(results[0].resultFlags).toBe(undefined);
    expect(results[1].resultFlags).toBe(undefined);
});
//# sourceMappingURL=haemoglobconcentration.test.js.map
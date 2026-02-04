"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.echo = exports.inputValues = exports.inputValue = exports.isDefined = exports.idToUUID = void 0;
exports.createCheckedAccessProxy = createCheckedAccessProxy;
const parameters = __importStar(require("./transformationParameters"));
const uuid_1 = require("uuid");
const inputSingleton_1 = require("./inputSingleton");
/*
 * Create a proxy for JS objects that ensure that the access to non-existing properties generate an error
 * It is intended to be used for the data sent to JSONata to avoid silent errors
 */
function createCheckedAccessProxy(obj) {
    const handler = {
        get(target, prop, receiver) {
            if (!(prop === 'sequence' || prop === 'then') && !(prop in target)) {
                throw new Error(`Property '${String(prop)}' does not exist in the object:${JSON.stringify(target)}`);
            }
            return Reflect.get(target, prop, receiver);
        }
    };
    return new Proxy(obj, handler);
}
/**
 * Generates a FHIR-compliant UUID based on an unique identified (e.g., participant id)
 */
const idToUUID = (id) => `urn:uuid:${(0, uuid_1.v5)(id, parameters.privateNameSpace)}`;
exports.idToUUID = idToUUID;
/**
 * Function to be used in JSONata for consistent validation of undefined properties/values
 * @param value
 * @returns
 */
const isDefined = (value) => {
    return value !== undefined;
};
exports.isDefined = isDefined;
/**
 * (Safer) alternative to the regular approach for referencing variables within a JSONata expression,
 * which reports an error if a given variable does not exist. Also useful for getting access to
 * the input variables within JSONAta bindings (external functions).
 * @param varname of the variable
 * @returns value of the given variable
 */
const inputValue = (varname, wave) => {
    const assessmentValues = inputSingleton_1.InputSingleton.getInstance().getInput(varname);
    if (assessmentValues === undefined)
        throw Error(`Variable ${varname} not provided in the input`);
    if (!(wave in assessmentValues))
        throw Error(`Assessment ${wave} not available for variable ${varname}`);
    const datafileVal = assessmentValues[wave];
    return assessmentValues[wave];
};
exports.inputValue = inputValue;
/**
 * Returns the map with all the assessments of a given variable.
 * Access to properties not defined in a given variable will raise an error
 * (a Proxy with this behavior is returned)
 * @param name
 * @param expectedAssessments assessment expected to be read from the datafile (including potentially missing ones)
 * @returns
 */
const inputValues = (varname) => {
    const assessmentValues = inputSingleton_1.InputSingleton.getInstance().getInput(varname);
    if (assessmentValues === undefined)
        throw Error(`Variable ${varname} not provided in the input`);
    return new Proxy(assessmentValues, {
        get(target, property) {
            if (!(property in target)) {
                throw new Error(`Property ${String(property)} does not exist in the object ${String(JSON.stringify(target))}.`);
            }
            return target[property];
        }
    });
};
exports.inputValues = inputValues;
/**
 * Returns the map with all the assessments of a given variable.
 * Access to properties not defined in a given variable will raise an error
 * (a Proxy with this behavior is returned)
 * @param name
 * @param expectedAssessments assessment expected to be read from the datafile (including potentially missing ones)
 * @returns
 */
/*export const inputValues = (name:string,expectedAssessments:string[]): variableAssessments => {

    //returns a Map. @TODO change getInput type from any to Map
    const assessmentValues:variableAssessments = InputSingleton.getInstance().getInput()[name];

    if (assessmentValues===undefined) throw Error(`Variable ${name} not provided in the input`)

    if (expectedAssessments.length !== Object.keys(assessmentValues).length){
      throw Error(`Expected assessments for variable ${name} (${expectedAssessments}) do not match the ones in the input file (${assessmentValues})`)
    }
    else{
      //Check that all the expected assessments (including potentially missing ones) were provided
      for (const expectedAssessment in expectedAssessments){
        if (!(expectedAssessment in assessmentValues)){
          throw Error(`Expected assessments for variable ${name} (${expectedAssessments}) do not match the ones in the input file (${assessmentValues}). Missing:${expectedAssessment}`)
        }
      }

      return assessmentValues;
    }
  }*/
/**
 * Function for echoing strings within a JSONata expression (for debugging purposes)
 * @param text
 * @returns
 */
const echo = (text) => console.info(`ECHO: ${text}`);
exports.echo = echo;
//# sourceMappingURL=functionsCatalog.js.map
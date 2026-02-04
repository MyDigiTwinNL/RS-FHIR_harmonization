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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
exports.processInput = processInput;
const fs_1 = __importDefault(require("fs"));
const jsonata_1 = __importDefault(require("jsonata"));
const uuid_1 = require("uuid");
const funcatalog = __importStar(require("./functionsCatalog"));
const lifelinesfunc = __importStar(require("./lifelinesFunctions"));
const transformationParameters_1 = require("./transformationParameters");
const inputSingleton_1 = require("./inputSingleton");
const unexpectedInputException_1 = require("./unexpectedInputException");
/**
 * Get the functions associated to a given object
 * @param object
 * @returns
 */
function getFunctionProperties(object) {
    const functionProperties = [];
    Object.getOwnPropertyNames(object).forEach(name => {
        if (typeof object[name] === 'function') {
            functionProperties.push(object[name]);
        }
    });
    return functionProperties;
}
/**
 * Register all the functions of the given object (a pairing rule module) on a JSONata expressions
 * These functions can be the ones explicitly exported in the module, or the ones from an object
 * exported by this module (this is the case when the function follows a given JS interface)
 *
 * @param moduleObject an module whose functions will be registered on the expression
 * @param prefix prefix that will be used refer to the functions within a JSONata template
 * @param expression jsonata expression where functions will be regitered
 */
function registerModuleFunctions(moduleObject, expression) {
    for (const rfunc of Object.values(moduleObject)) {
        //The function is a root element of the module
        if ((typeof rfunc) === 'function') {
            //console.info(`Registering regular function ${(rfunc as Function).name} for ${prefix}`)
            expression.registerFunction(`${rfunc.name}`, rfunc);
        }
        //The function is defined within a module's object (this is used when the module 
        //implementation is based on an interface.    
        else if ((typeof rfunc) === 'object') {
            //console.info(`Registering functions from exported JS object ${rfunc}`)
            const funcs = getFunctionProperties(rfunc);
            funcs.forEach((f) => {
                const plainF = f;
                //console.info(`...... Function ${plainF.name} for ${prefix}`)        
                expression.registerFunction(`${plainF.name}`, plainF);
            });
        }
    }
}
/**
 * Setting up a collection of JSOnata expressions based on the given MappingTargets (templates and related modules)
 * @param targets mapping targets
 * @returns Expressions ready to be used for transforming input data
 */
async function setup(targets) {
    const resourceExpressions = [];
    //an expression evaluator for each type of resource (so memoization is used across multiple inputs)
    for (const target of targets) {
        const expression = (0, jsonata_1.default)(fs_1.default.readFileSync(target.template, 'utf8'));
        //Register general-purpose functions
        for (const libfunc of Object.values(funcatalog)) {
            expression.registerFunction(libfunc.name, libfunc);
        }
        //register lifelines-specific functions
        for (const libfunc of Object.values(lifelinesfunc)) {
            expression.registerFunction(libfunc.name, libfunc);
        }
        //register resource-specific functions, set the modulename as a prefix
        await Promise.resolve(`${target.module}`).then(s => __importStar(require(s))).then((rfuncs) => registerModuleFunctions(rfuncs, expression)).then(() => {
            resourceExpressions.push(expression);
        });
    }
    return resourceExpressions;
}
/**
 * Perform a transformation of all the data given as 'input', based the configurations
 * of templates and modules of the 'mappings' parameter, into individual FHIR
 * JSON resources
 * @param input a JSON object with the data encoded as expected by the templates and
 * modules given in the mappings parameter
 * @param mappings configuration of templates and modules to be used in the transformation
 * @returns An array of JSON FHIR objects
 */
async function processInput(input, mappings) {
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    const resources = [];
    const resourceExpressions = await setup(mappings);
    await Promise.all(resourceExpressions.map(async (expression) => {
        try {
            const output = await expression.evaluate(input);
            //the output can be an array of resources (e.g., lab results involve multiple linked resources)
            if (Array.isArray(output)) {
                output.forEach((resource) => {
                    //Some of the resources within the array may be empty (when no created due to missing information)
                    if (Object.keys(resource).length > 0)
                        resources.push(resource);
                });
            }
            //include only non-empty outputs (empty objects are returned when the resource should not be part of the participant's bundle)
            else if (typeof output === 'object' && Object.keys(output).length > 0) {
                resources.push(output);
            }
            //TODO double-check types here
            //if none of the above, it should be an empty object or undefined
            /*else if (typeof output === 'object' && Object.keys(output).length === 0) {
            
            }
            else{
              
            }*/
        }
        catch (error) {
            if (error instanceof unexpectedInputException_1.UnexpectedInputException) {
                throw error;
            }
            else {
                throw new Error(`Error while transforming a JSonata expression `, { cause: error });
                //throw new Error(`Error while transforming a JSonata expression [${JSON.stringify(expression.ast())}]`, { cause: error })  
            }
        }
    }));
    return resources;
}
/**
 * Turns an array of individual FHIR resources into a FHIR bundle
 * @param resources array of FHIR resources
 * @returns a FHIR bundle
 */
function generateBundle(resources) {
    const resourcesBundle = {
        entry: [],
        resourceType: "Bundle",
        type: "transaction"
    };
    resources.forEach((resource) => {
        if ('id' in resource) {
            //Using a fixed namespace to ensure the UUIDs are always the same given the resource id.
            const resourceUUID = (0, uuid_1.v5)(resource.id, transformationParameters_1.privateNameSpace);
            const bundleEntry = { "fullUrl": `urn:uuid:${resourceUUID}`, "request": { "method": "POST", "url": "http://localhost:8080/fhir" }, "resource": resource };
            resourcesBundle.entry.push(bundleEntry);
        }
        else {
            throw new Error(`Resource ${resource} does not have an 'id' property.`);
        }
    });
    return resourcesBundle;
}
/**
 * Perform a transformation of all the data given as 'input', based on the configurations
 * of templates and modules of the 'mappings' parameter, into a JSON FHIR bundle
 * @param input
 * @param mappings
 * @returns
 */
const transform = function (input, mappings) {
    return processInput(input, mappings).then((output) => {
        return generateBundle(output);
    });
};
exports.transform = transform;
//# sourceMappingURL=mapper_old_lifelines.js.map
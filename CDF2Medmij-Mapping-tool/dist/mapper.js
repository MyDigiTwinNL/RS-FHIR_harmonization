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
exports.transform = transform;
const fs_1 = __importDefault(require("fs"));
const jsonata_1 = __importDefault(require("jsonata"));
const uuid_1 = require("uuid");
const funcatalog = __importStar(require("./functionsCatalog"));
const lifelinesfunc = __importStar(require("./lifelinesFunctions"));
const transformationParameters_1 = require("./transformationParameters");
const inputSingleton_1 = require("./inputSingleton");
const unexpectedInputException_1 = require("./unexpectedInputException");
/**
 * Collect all function-valued properties of an object.
 */
function getFunctionProperties(obj) {
    return Object.values(obj).filter((v) => typeof v === 'function');
}
/**
 * Register all exported functions from a rule module into a JSONata expression.
 *
 * Functions are registered under their own name (no prefix), consistent with
 * how the templates refer to them.
 */
function registerModuleFunctions(expression, moduleExports) {
    const funcs = getFunctionProperties(moduleExports);
    funcs.forEach((f) => {
        const fn = f;
        if (!fn.name) {
            // anonymous function – skip
            return;
        }
        expression.registerFunction(fn.name, fn);
    });
}
/**
 * Builds an array of JSONata expressions given:
 *   - mapping targets (template+module)
 *   - a *helper function module* (Lifelines by default, Rotterdam when passed)
 *
 * `helperModule` is where functions like `resourceId`, `waveSpecificResourceId`,
 * date helpers, etc. live. For Lifelines this is lifelinesFunctions.ts; for
 * Rotterdam we pass lifelinesFunctions_rotterdam.ts.
 */
async function setup(targets, helperModule = lifelinesfunc) {
    const resourceExpressions = [];
    for (const target of targets) {
        const templateSource = fs_1.default.readFileSync(target.template, 'utf8');
        const expression = (0, jsonata_1.default)(templateSource);
        // Register general-purpose functions (functionsCatalog.ts)
        for (const libfunc of Object.values(funcatalog)) {
            const fn = libfunc;
            if (typeof fn === 'function' && fn.name) {
                expression.registerFunction(fn.name, fn);
            }
        }
        // Register cohort-specific helper functions (Lifelines or Rotterdam)
        for (const libfunc of Object.values(helperModule)) {
            const fn = libfunc;
            if (typeof fn === 'function' && fn.name) {
                expression.registerFunction(fn.name, fn);
            }
        }
        // Register resource-specific functions from the rule module
        const ruleModule = await Promise.resolve(`${target.module}`).then(s => __importStar(require(s)));
        registerModuleFunctions(expression, ruleModule);
        resourceExpressions.push(expression);
    }
    return resourceExpressions;
}
/**
 * Generate a FHIR Bundle from a list of resources.
 *
 * For each resource:
 *   - Use its existing `id` field as the stable key
 *   - Generate a UUIDv5 fullUrl based on `privateNameSpace`
 *   - Add a `transaction`-style entry
 */
function generateBundle(resources) {
    const bundle = {
        entry: [],
        resourceType: 'Bundle',
        type: 'transaction',
    };
    resources.forEach((resource) => {
        if (!resource)
            return;
        if (!('id' in resource)) {
            throw new Error('Resource without id encountered when building bundle');
        }
        const logicalId = resource.id;
        const uuid = (0, uuid_1.v5)(logicalId, transformationParameters_1.privateNameSpace);
        bundle.entry.push({
            fullUrl: `urn:uuid:${uuid}`,
            resource,
            request: {
                method: 'PUT',
                url: `${resource.resourceType}/${uuid}`,
            },
        });
    });
    return bundle;
}
/**
 * Main transformation function.
 *
 * - `input` is the CDF transformVariables object
 * - `targets` is the list of templates + rule modules
 * - `helperModule` is the cohort-specific helper set
 *     (defaults to lifelinesFunctions for backward compatibility)
 */
async function transform(input, targets, helperModule = lifelinesfunc) {
    // Initialize singleton input holder
    inputSingleton_1.InputSingleton.getInstance().setInput(input);
    // Prepare expressions with the appropriate helper module
    const expressions = await setup(targets, helperModule);
    const resources = [];
    for (const expression of expressions) {
        try {
            const result = await expression.evaluate({});
            if (Array.isArray(result)) {
                result.forEach((r) => {
                    if (r !== undefined && r !== null) {
                        resources.push(r);
                    }
                });
            }
            else if (result !== undefined && result !== null) {
                resources.push(result);
            }
        }
        catch (err) {
            if (err instanceof unexpectedInputException_1.UnexpectedInputException) {
                // Propagate explicit data/logic errors unchanged
                throw err;
            }
            else {
                // Log other errors and keep going with remaining resources
                // (you may want to make this stricter depending on your use case)
                console.error('Error evaluating JSONata expression:', err.message || err);
            }
        }
    }
    return generateBundle(resources);
}
//# sourceMappingURL=mapper.js.map
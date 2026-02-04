import fs from 'fs';
import jsonata from 'jsonata';
import { v5 as uuidv5 } from 'uuid';

import * as funcatalog from './functionsCatalog';
import * as lifelinesfunc from './lifelinesFunctions';

import { privateNameSpace } from './transformationParameters';
import { InputSingleton } from './inputSingleton';
import { transformVariables } from './functionsCatalog';
import { UnexpectedInputException } from './unexpectedInputException';

export interface MappingTarget {
  template: string; // path to JSONata template
  module: string;   // path to TS module with rule functions
}

/**
 * Collect all function-valued properties of an object.
 */
function getFunctionProperties(obj: any): Function[] {
  return Object.values(obj).filter((v) => typeof v === 'function') as Function[];
}

/**
 * Register all exported functions from a rule module into a JSONata expression.
 *
 * Functions are registered under their own name (no prefix), consistent with
 * how the templates refer to them.
 */
function registerModuleFunctions(
  expression: jsonata.Expression,
  moduleExports: any
): void {
  const funcs = getFunctionProperties(moduleExports);
  funcs.forEach((f) => {
    const fn = f as () => void;
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
async function setup(
  targets: MappingTarget[],
  helperModule: any = lifelinesfunc
): Promise<jsonata.Expression[]> {
  const resourceExpressions: jsonata.Expression[] = [];

  for (const target of targets) {
    const templateSource = fs.readFileSync(target.template, 'utf8');
    const expression = jsonata(templateSource);

    // Register general-purpose functions (functionsCatalog.ts)
    for (const libfunc of Object.values(funcatalog)) {
      const fn = libfunc as any;
      if (typeof fn === 'function' && fn.name) {
        expression.registerFunction(fn.name, fn);
      }
    }

    // Register cohort-specific helper functions (Lifelines or Rotterdam)
    for (const libfunc of Object.values(helperModule)) {
      const fn = libfunc as any;
      if (typeof fn === 'function' && fn.name) {
        expression.registerFunction(fn.name, fn);
      }
    }

    // Register resource-specific functions from the rule module
    const ruleModule = await import(target.module);
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
function generateBundle(resources: any[]): object {
  const bundle: { entry: any[]; resourceType: string; type: string } = {
    entry: [],
    resourceType: 'Bundle',
    type: 'transaction',
  };

  resources.forEach((resource) => {
    if (!resource) return;

    if (!('id' in resource)) {
      throw new Error('Resource without id encountered when building bundle');
    }

    const logicalId = resource.id as string;
    const uuid = uuidv5(logicalId, privateNameSpace);

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
export async function transform(
  input: transformVariables,
  targets: MappingTarget[],
  helperModule: any = lifelinesfunc
): Promise<object> {
  // Initialize singleton input holder
  InputSingleton.getInstance().setInput(input);

  // Prepare expressions with the appropriate helper module
  const expressions = await setup(targets, helperModule);

  const resources: any[] = [];

  // for (const expression of expressions) {
  //   try {
  //     const result = await expression.evaluate({});

  //     if (Array.isArray(result)) {
  //       result.forEach((r) => {
  //         if (r !== undefined && r !== null) {
  //           resources.push(r);
  //         }
  //       });
  //     } else if (result !== undefined && result !== null) {
  //       resources.push(result);
  //     }
  //   } catch (err: any) {
  //     if (err instanceof UnexpectedInputException) {
  //       // Propagate explicit data/logic errors unchanged
  //       throw err;
  //     } else {
  //       // Log other errors and keep going with remaining resources
  //       // (you may want to make this stricter depending on your use case)
  //       console.error('Error evaluating JSONata expression:', err.message || err);
  //     }
  //   }
  // }

  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];
    const target = targets[i];   // <--- this is the MappingTarget
  
    try {
      const result = await expression.evaluate({});
  
      if (Array.isArray(result)) {
        result.forEach((r) => {
          if (r !== undefined && r !== null) {
            resources.push(r);
          }
        });
      } else if (result !== undefined && result !== null) {
        resources.push(result);
      }
    } catch (err: any) {
      if (err instanceof UnexpectedInputException) {
        throw err;
      } else {
        console.error(
          `Error evaluating JSONata expression for template ${target.template}:`,
          err.message || err,
        );
      }
    }
  }
  

  return generateBundle(resources);
}



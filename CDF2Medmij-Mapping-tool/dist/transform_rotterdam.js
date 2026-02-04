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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mapper_1 = require("./mapper");
const rotterdamFunctions = __importStar(require("./lifelinesFunctions_rotterdam"));
// --------------
// 1. Define all mapping targets for Rotterdam Study
// --------------
const targets = [
    //
    // --- PATIENT ---
    //
    {
        template: '../zib-2017-mappings/Patient.jsonata',
        module: './rotterdam/Patient',
    },
    //
    // --- BLOOD PRESSURE ---
    //
    {
        template: '../zib-2017-mappings/BloodPressure.jsonata',
        module: './rotterdam/BloodPressure',
    },
    //
    // --- LIPIDS ---
    //
    {
        template: '../zib-2017-mappings/HDLCholesterol_Diagnostic_Report.jsonata',
        module: './rotterdam/HDLCholesterol',
    },
    {
        template: '../zib-2017-mappings/HDLCholesterol_Observation.jsonata',
        module: './rotterdam/HDLCholesterol',
    },
    {
        template: '../zib-2017-mappings/LDLCholesterol_Diagnostic_Report.jsonata',
        module: './rotterdam/LDLCholesterol',
    },
    {
        template: '../zib-2017-mappings/LDLCholesterol_Observation.jsonata',
        module: './rotterdam/LDLCholesterol',
    },
    {
        template: '../zib-2017-mappings/LDLCholesterol_Specimen.jsonata',
        module: './rotterdam/LDLCholesterol',
    },
    {
        template: '../zib-2017-mappings/TotalCholesterol_Diagnostic_Report.jsonata',
        module: './rotterdam/TotalCholesterol',
    },
    {
        template: '../zib-2017-mappings/TotalCholesterol_Observation.jsonata',
        module: './rotterdam/TotalCholesterol',
    },
    //
    // --- RENAL / LABS ---
    //
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Diagnostic_Report.jsonata',
        module: './rotterdam/Creatinine',
    },
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Observation.jsonata',
        module: './rotterdam/Creatinine',
    },
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Specimen.jsonata',
        module: './rotterdam/Creatinine',
    },
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Diagnostic_Report.jsonata',
        module: './rotterdam/eGFR',
    },
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Observation.jsonata',
        module: './rotterdam/eGFR',
    },
    {
        template: '../zib-2017-mappings/generic/LabTestResult_Specimen.jsonata',
        module: './rotterdam/eGFR',
    },
    //
    // --- LIFESTYLE ---
    //
    {
        template: '../zib-2017-mappings/TobaccoUse.jsonata',
        module: './rotterdam/TobaccoUse',
    },
    //
    // --- CONDITIONS / PREDICTORS ---
    //
    {
        template: '../zib-2017-mappings/Hypertension.jsonata',
        module: './rotterdam/Hypertension',
    },
    {
        template: '../zib-2017-mappings/generic/Condition.jsonata',
        module: './rotterdam/Diabetes',
    },
    //
    // --- OUTCOMES ---
    //
    {
        template: '../zib-2017-mappings/generic/Condition.jsonata',
        module: './rotterdam/MyocardialInfarction',
    },
    {
        template: '../zib-2017-mappings/generic/Condition.jsonata',
        module: './rotterdam/Stroke',
    },
    {
        template: '../zib-2017-mappings/generic/Condition.jsonata',
        module: './rotterdam/HeartFailure',
    },
    {
        template: '../zib-2017-mappings/generic/Condition.jsonata',
        module: './rotterdam/CardioVascularDisease',
    },
];
// --------------
// 2 & 3. CLI: read input CDF folder → write output FHIR folder
// --------------
const usage = () => {
    console.log(`
Usage:
  npx ts-node src/transform_rotterdam.ts <cdf_input_folder> <fhir_output_folder>

Example:
  npx ts-node src/transform_rotterdam.ts data/cdf_rotterdam data/fhir_rotterdam
`);
};
async function main() {
    if (process.argv.length < 4) {
        usage();
        process.exit(1);
    }
    const inputDir = process.argv[2];
    const outputDir = process.argv[3];
    // create output folder if missing
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // read all .json CDF files in the folder
    const files = fs_1.default.readdirSync(inputDir).filter((f) => f.endsWith('.json'));
    console.log(`Found ${files.length} CDF files to process.`);
    for (const file of files) {
        const inputFilePath = path_1.default.join(inputDir, file);
        const json = JSON.parse(fs_1.default.readFileSync(inputFilePath, 'utf8'));
        console.log(`Transforming ${file} ...`);
        // Use Rotterdam-specific helper functions here
        const fhirBundle = await (0, mapper_1.transform)(json, targets, rotterdamFunctions);
        const outputName = file.replace('.json', '_fhir.json');
        const outputFilePath = path_1.default.join(outputDir, outputName);
        fs_1.default.writeFileSync(outputFilePath, JSON.stringify(fhirBundle, null, 2));
    }
    console.log('Done. Rotterdam FHIR bundles created.');
}
main().catch((err) => {
    console.error('Error in transform_rotterdam:', err);
    process.exit(1);
});
//# sourceMappingURL=transform_rotterdam.js.map
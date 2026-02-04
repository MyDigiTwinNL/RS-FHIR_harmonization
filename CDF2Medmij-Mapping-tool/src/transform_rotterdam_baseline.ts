import fs from 'fs';
import path from 'path';
import { MappingTarget, transform } from './mapper';
import * as rotterdamFunctions from './lifelinesFunctions_rotterdam';

// --------------
// 1. Define all mapping targets for Rotterdam Study
// --------------

const targets: MappingTarget[] = [
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
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // read all .json CDF files in the folder
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.json'));

  console.log(`Found ${files.length} CDF files to process.`);

  for (const file of files) {
    const inputFilePath = path.join(inputDir, file);
    const json = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    console.log(`Transforming ${file} ...`);

    // Use Rotterdam-specific helper functions here
    const fhirBundle = await transform(json, targets, rotterdamFunctions);

    const outputName = file.replace('.json', '_fhir.json');
    const outputFilePath = path.join(outputDir, outputName);

    fs.writeFileSync(outputFilePath, JSON.stringify(fhirBundle, null, 2));
  }

  console.log('Done. Rotterdam FHIR bundles created.');
}

main().catch((err) => {
  console.error('Error in transform_rotterdam:', err);
  process.exit(1);
});

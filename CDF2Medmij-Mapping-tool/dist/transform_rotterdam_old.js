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
const path = __importStar(require("path"));
const mapper_1 = require("./mapper");
const inputSingleton_1 = require("./inputSingleton");
const unexpectedInputException_1 = require("./unexpectedInputException");
const targets = [
    // Patient
    { template: '../zib-2017-mappings/Patient.jsonata', module: './rotterdam/Patient' },
    // Blood pressure
    { template: '../zib-2017-mappings/BloodPressure.jsonata', module: './rotterdam/BloodPressure' },
    // Lipids
    { template: '../zib-2017-mappings/HDLCholesterol_Diagnostic_Report.jsonata', module: './rotterdam/HDLCholesterol' },
    { template: '../zib-2017-mappings/HDLCholesterol_Observation.jsonata', module: './rotterdam/HDLCholesterol' },
    { template: '../zib-2017-mappings/LDLCholesterol_Diagnostic_Report.jsonata', module: './rotterdam/LDLCholesterol' },
    { template: '../zib-2017-mappings/LDLCholesterol_Observation.jsonata', module: './rotterdam/LDLCholesterol' },
    { template: '../zib-2017-mappings/LDLCholesterol_Specimen.jsonata', module: './rotterdam/LDLCholesterol' },
    { template: '../zib-2017-mappings/TotalCholesterol_Diagnostic_Report.jsonata', module: './rotterdam/TotalCholesterol' },
    { template: '../zib-2017-mappings/TotalCholesterol_Observation.jsonata', module: './rotterdam/TotalCholesterol' },
    // Renal / creatinine
    { template: '../zib-2017-mappings/generic/LabTestResult_Diagnostic_Report.jsonata', module: './rotterdam/Creatinine' },
    { template: '../zib-2017-mappings/generic/LabTestResult_Observation.jsonata', module: './rotterdam/Creatinine' },
    { template: '../zib-2017-mappings/generic/LabTestResult_Specimen.jsonata', module: './rotterdam/Creatinine' },
    { template: '../zib-2017-mappings/generic/LabTestResult_Diagnostic_Report.jsonata', module: './rotterdam/eGFR' },
    { template: '../zib-2017-mappings/generic/LabTestResult_Observation.jsonata', module: './rotterdam/eGFR' },
    { template: '../zib-2017-mappings/generic/LabTestResult_Specimen.jsonata', module: './rotterdam/eGFR' },
    // Lifestyle
    { template: '../zib-2017-mappings/TobaccoUse.jsonata', module: './rotterdam/TobaccoUse' },
    // Conditions / predictors
    { template: '../zib-2017-mappings/Hypertension.jsonata', module: './rotterdam/Hypertension' },
    { template: '../zib-2017-mappings/generic/Condition.jsonata', module: './rotterdam/Diabetes' },
    // Outcomes
    { template: '../zib-2017-mappings/generic/Condition.jsonata', module: './rotterdam/MyocardialInfarction' },
    { template: '../zib-2017-mappings/generic/Condition.jsonata', module: './rotterdam/Stroke' },
    { template: '../zib-2017-mappings/generic/Condition.jsonata', module: './rotterdam/HeartFailure' },
    { template: '../zib-2017-mappings/generic/Condition.jsonata', module: './rotterdam/CardioVascularDisease' },
];
/**
 * //To resolve all relative paths from the 'dist' folder.
 */
const resolveLocalPath = () => {
    const folderPath = path.resolve(__dirname);
    process.chdir(folderPath);
};
const inputFileToStdout = (filePath) => {
    resolveLocalPath();
    /*Transformation performed with a mutex to prevent async race conditions due to the shared variable (InputSingletone)
      between the mapping modules and the JSONata templates. The mutex is released after the transformation is performed
      so the input cannot be changed in the process.*/
    inputSingleton_1.InputSingleton.getInstance().getMutex().acquire().then((releasemutex) => {
        const input = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
        (0, mapper_1.transform)(input, targets).then((output) => {
            console.info(JSON.stringify(output));
            releasemutex();
        });
    });
};
const inputFileToFolder = async (filePath, outputFolder) => {
    //To resolve all relative paths from the 'dist' folder.
    resolveLocalPath();
    await inputSingleton_1.InputSingleton.getInstance().getMutex().acquire();
    try {
        const input = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
        const output = await (0, mapper_1.transform)(input, targets);
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(filePath);
        const fileNameWithoutExtension = fileName.replace(fileExtension, '');
        const fhirFileName = `${fileNameWithoutExtension}-fhir${fileExtension}`;
        const outputFilePath = path.join(outputFolder, fhirFileName);
        fs_1.default.writeFileSync(outputFilePath, JSON.stringify(output));
        console.info(`${filePath} ====> ${outputFilePath}`);
    }
    finally {
        inputSingleton_1.InputSingleton.getInstance().getMutex().release();
    }
};
/**
 *
 * @param inputFolder
 * @param outputFolder
 * @throws
 */
const inputFolderToOutputFolder = async (inputFolder, outputFolder) => {
    const errList = [];
    const errFiles = [];
    const fileNames = fs_1.default.readdirSync(inputFolder);
    for (const fileName of fileNames) {
        console.info(`Processing ${fileName}`);
        const filePath = path.join(inputFolder, fileName);
        const fileStats = fs_1.default.statSync(filePath);
        if (fileStats.isFile() && fileName.toLowerCase().endsWith(".json")) {
            try {
                await inputFileToFolder(filePath, outputFolder);
            }
            catch (err) {
                if (err instanceof unexpectedInputException_1.UnexpectedInputException) {
                    console.info(`Skipping ${filePath} due to a variable that wasn't expected to be undefined: ${err.message}`);
                    errList.push(`Skipping ${filePath} due to a variable that wasn't expected to be undefined: ${err.message}`);
                    errFiles.push(`${filePath}`);
                }
                else {
                    console.info(`Aborting transformation due to an error while processing ${filePath}: ${err}`);
                    process.exit(1);
                }
            }
        }
    }
    //inputFileToFolder is performed asyncrhonously. Synchronize all the
    //await Promise.all(promises);
    if (errList.length > 0) {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:T.-]/g, '_');
        const errorLogPath = `/tmp/errors_${timestamp}.txt`;
        const failedFilesLogPath = `/tmp/failed_files_${timestamp}.txt`;
        fs_1.default.writeFile(errorLogPath, errList.join('\n'), (error) => {
            if (error) {
                console.error(`Unable to save error files ${errorLogPath}`);
            }
            else {
                console.log(`Details of files with errors were written on ${errorLogPath}`);
            }
        });
        fs_1.default.writeFile(failedFilesLogPath, errFiles.join('\n'), (error) => {
            if (error) {
                console.error(`Unable to save error files ${failedFilesLogPath}`);
            }
            else {
                console.log(`The list of files with inconsistencies was written on ${failedFilesLogPath}`);
            }
        });
    }
    else {
        console.info('Finished with no errors');
    }
};
// Check if a file exists
const validateFileExistence = (filePath) => {
    try {
        fs_1.default.accessSync(filePath);
        return true;
    }
    catch (error) {
        return false;
    }
};
const validateFolderExistence = (folderPath) => {
    try {
        const stats = fs_1.default.statSync(folderPath);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
};
function printCommandLineArguments() {
    console.log('Program parameters details:');
    console.log('Process all the files in a folder (output folder is mandatory):');
    console.log(`npm run transform -- <input folder path> -o <output folder path>`);
    console.log('Process a single file and generate a file with the output in a given folder:');
    console.log(`npm run transform -- <input file path> -o <output folder path>`);
    console.log('Process a single file and print the output on STDOUT:');
    console.log(`npm run transform -- <input file path>`);
}
function processArguments(args) {
    if (args.length === 0) {
        printCommandLineArguments();
        return;
    }
    let folderPath = null;
    let filePath = null;
    let outputFolder = null;
    if (args.length === 1) {
        const arg = args[0];
        if (validateFolderExistence(arg)) {
            console.error('Error: a folder path was given as an input, but the output folder is missing (-o option followed by the output folder)');
            return;
        }
        else if (validateFileExistence(arg)) {
            filePath = path.resolve(arg);
            inputFileToStdout(filePath);
        }
        else {
            console.error(`Error: the path or folder given as an input does not exist: '${arg}'`);
            return;
        }
    }
    else if (args.length === 3) {
        const arg1 = args[0];
        const arg2 = args[1];
        const arg3 = args[2];
        if (arg2 === '-o') {
            if (validateFolderExistence(arg1) && validateFolderExistence(arg3)) {
                folderPath = path.resolve(arg1);
                outputFolder = path.resolve(arg3);
                inputFolderToOutputFolder(folderPath, outputFolder);
            }
            else if (validateFileExistence(arg1) && validateFolderExistence(arg3)) {
                filePath = path.resolve(arg1);
                outputFolder = path.resolve(arg3);
                inputFileToFolder(filePath, outputFolder);
            }
            else {
                console.error(`Error: Invalid or non existing input/output paths. Input: ${arg1}, Output: ${arg3}`);
                return;
            }
        }
        else {
            console.error('Error: Invalid arguments');
            printCommandLineArguments();
            return;
        }
    }
    else {
        console.error('Error: Invalid command');
        printCommandLineArguments();
        return;
    }
}
// Get command line arguments
const args = process.argv.slice(2);
processArguments(args);
//# sourceMappingURL=transform_rotterdam_old.js.map
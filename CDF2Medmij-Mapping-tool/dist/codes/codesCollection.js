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
exports.CodesCollection = exports.getUCUMCode = exports.getLOINCCode = exports.getSNOMEDCode = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
const getSNOMEDCode = (code) => {
    return CodesCollection.getInstance().getSNOMEDCode(code);
};
exports.getSNOMEDCode = getSNOMEDCode;
const getLOINCCode = (code) => {
    return CodesCollection.getInstance().getLOINCCode(code);
};
exports.getLOINCCode = getLOINCCode;
const getUCUMCode = (code) => {
    return CodesCollection.getInstance().getUCUMCode(code);
};
exports.getUCUMCode = getUCUMCode;
/**
 * Singleton to access the details (CodeProperties) of the currently available codes
 */
class CodesCollection {
    static instance = null;
    snomedMap = new Map();
    loincMap = new Map();
    manchetMap = new Map();
    fhirv3Map = new Map();
    ucumMap = new Map();
    loadCodesFile = (filePath) => {
        const codesMap = new Map();
        const records = (0, sync_1.parse)(fs.readFileSync(filePath, 'utf8'), {
            columns: true,
            skip_empty_lines: true
        });
        for (const record of records) {
            codesMap.set(record.code, record);
        }
        return codesMap;
    };
    constructor() {
        this.snomedMap = this.loadCodesFile(path.resolve(__dirname, '../../codefiles/snomed.csv'));
        this.loincMap = this.loadCodesFile(path.resolve(__dirname, '../../codefiles/loinc.csv'));
        this.manchetMap = this.loadCodesFile(path.resolve(__dirname, '../../codefiles/manchet.csv'));
        this.fhirv3Map = this.loadCodesFile(path.resolve(__dirname, '../../codefiles/fhirv3.csv'));
        this.ucumMap = this.loadCodesFile(path.resolve(__dirname, '../../codefiles/ucum.csv'));
    }
    ;
    static getInstance() {
        if (!this.instance) {
            this.instance = new CodesCollection();
        }
        return this.instance;
    }
    getSNOMEDCode(code) {
        const codeProp = this.snomedMap.get(code);
        if (codeProp !== undefined)
            return codeProp;
        throw Error(`Error while trying to access an undefined SNOMED code ${code}`);
    }
    getLOINCCode(code) {
        const codeProp = this.loincMap.get(code);
        if (codeProp !== undefined)
            return codeProp;
        throw Error(`Error while trying to access an undefined LOINC code ${code}`);
    }
    getUCUMCode(code) {
        const codeProp = this.ucumMap.get(code);
        if (codeProp !== undefined)
            return codeProp;
        throw Error(`Error while trying to access an undefined UCUM (units of measurement) code ${code}`);
    }
}
exports.CodesCollection = CodesCollection;
//const cl = CodesCollection.getInstance();
//console.info(cl.getSNOMEDCode('6685009'))
//console.info(cl.getLOINCCode('14646-4'))
//# sourceMappingURL=codesCollection.js.map
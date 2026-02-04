# 📘 README_rotterdam.md  
### **Rotterdam Study (RS) – CDF → FHIR Conversion Pipeline**  
### *Harmonized with the Lifelines PoC (Computers in Biology & Medicine, 2025)*

## 📌 Overview
This document describes how Rotterdam Study (RS) participant data—exported from the RS Outcome Pipeline—are transformed into:

1. **CDF JSON** (Clinical Data Format), using  
   ➤ *LifelinesCSV2CDF*  
2. **FHIR Bundles** following **ZIB 2017 + MedMij** profiles, using  
   ➤ *CDF2MedMij-Mapping-Tool (this repository)*

The output FHIR bundles are **fully harmonized** with the Lifelines implementation, which enables **federated learning on pooled but locally stored harmonized predictors and CVD outcomes**.

## 🏗️ Pipeline Architecture

### Step 1 — RS CSV → CDF JSON  
Using: https://github.com/MyDigiTwinNL/LifelinesCSV2CDF

You provide:
- An RS CSV dataset  
- A mapping config (.ini/.yaml)

Output:
```
participant_id.cdf.json
```

### Step 2 — CDF JSON → FHIR Bundle  
Using the mapping engine of this repository.

For **Rotterdam**, we built a separate mapping layer:
```
src/rotterdam/
    BloodPressure.ts
    HDLCholesterol.ts
    LDLCholesterol.ts
    TotalCholesterol.ts
    Creatinine.ts
    eGFR.ts
    TobaccoUse.ts
    Hypertension.ts
    Diabetes.ts
    MyocardialInfarction.ts
    Stroke.ts
    HeartFailure.ts
    CardioVascularDisease.ts
    Patient.ts
```

Each module exports logical components used inside the ZIB JSONata templates.

## 🎯 Goals of the RS-specific implementation
✓ Produce **FHIR bundles structurally identical** to Lifelines bundles  
✓ Use **true registry-linked dates** for CVD events  
✓ Use **baseline measurements** without imputation  
✓ Ensure **predictor and outcome definitions** match the Lifelines PoC  
✓ Allow **drop-in federated learning** on harmonized datasets  

## 🔧 1. Rotterdam Function Layer
A Rotterdam-specific helper set:
```
src/lifelinesFunctions_rotterdam.ts
```
Provides:
- `resourceId`
- `waveSpecificResourceId`
- `rsDateToISO`
- `rsNumeric`
- `rsBool`

Bound to JSONata via:
```ts
mapper.setup(generalFunctions, rotterdamFunctions);
```

## 🔧 2. Rotterdam Transform Entry Point
```
src/transform_rotterdam.ts
```

Run via:
```bash
npx ts-node src/transform_rotterdam.ts data/cdf_rotterdam data/fhir_rotterdam
```

## 📦 3. RS → FHIR Mapping Logic (Summary)
Predictors:
- BP: `sbp.a1`, `dbp.a1`
- Lipids: `TC_mmol.a1`, `LDL_mmol.a1`, `HDL_mmol.a1`
- Renal: `creat_umol.a1`, `eGFR_ckdepi.a1`
- Smoking: `smoking_status.a1`
- HTN: `prev_HT_bool.a1` / `prev_HT.a1`
- Diabetes: `prev_DM_bool.a1`, `prev_DM_type.a1`

Outcomes:
- MI: `incident_mi_bool.a1`, `incident_mi_date_derived.a1`
- Stroke: `incident_stroke_bool.a1`, `incident_stroke_date_derived.a1`
- HF: `inc_hf_2018.a1`, `enddat_hf.a1`
- Composite CVD: `incident_cvd_composite_bool.a1`, `incident_cvd_date_derived.a1`

## 🔁 5. Folder Structure
```
src/
  transform.ts
  transform_rotterdam.ts
  lifelines/
  rotterdam/
  lifelinesFunctions.ts
  lifelinesFunctions_rotterdam.ts
```

## 📤 6. Running the RS FHIR Pipeline
Input: folder of `.cdf.json` files  
Output: FHIR bundles per participant

Command:
```bash
npm install --save-dev ts-node typescript
```

To run,
```bash
npm run transform:rotterdam -- /data_cdf_example /data_fhir_example
```

or

```bash
npx ts-node src/transform_rotterdam.ts input_cdf output_fhir
```

## 🧪 7. FHIR Validation
```bash
java -jar validator_cli.jar participant_fhir.json
```

## 🤝 8. Notes on Harmonization
- Fully compatible with Lifelines JSONata templates  
- Predictor & outcome harmonization is guaranteed  
- Safe for federated learning pipelines  


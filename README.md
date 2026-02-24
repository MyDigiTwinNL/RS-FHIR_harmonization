# Rotterdam Study → CDF → FHIR Pipeline (Cheat Sheet)

This document summarizes the preliminary workflow used to transform tabular CSV data into **CDF (ICDF)** files and subsequently into **FHIR** resources for federated learning and harmonization experiments.

The pipeline mainly consists of:

1. CSV variable extraction
2. Config generation for CDF conversion
3. CSV → CDF conversion
4. CDF → FHIR transformation
5. Dataset‑specific mapping (Rotterdam Study)

---

# 1. CSV → CDF Conversion (lifelinescsv_to_icdf)

To transform sample or real data files into CDF format:

```bash
python -m lifelinescsv_to_icdf.cdfgenerator <file_with_ids> <config_file> <output_folder>
```

You must first define the location of the assessments of the variables in the configuration file.

### Example paths

```bash
# Example 1
python -m lifelinescsv_to_icdf.cdfgenerator \
  /home/umcg-hcadavid/temporal-data/csv2csd/ids.csv \
  /home/umcg-hcadavid/temporal-data/csv2csd/csv2csdconfig.json \
  /home/umcg-hcadavid/temporal-data/pheno_lifelines_csd_out

# Example 2
python -m lifelinescsv_to_icdf.cdfgenerator \
  /home/hmo/RS_CSV2CDF/dummy_practice/samplecsv/bigfiles/pseudo_ids.csv \
  /home/hmo/RS_CSV2CDF/dummy_practice/sample-configs/one-csv-15-vars-config.json \
  /home/hmo/RS_CSV2CDF/dummy_practice/dummy_csd_out
```

---

# 2. MDT Proof‑of‑Concept Variables

## Predictors

* age
* sex
* eGFR
* albumin
* HDL cholesterol
* LDL cholesterol
* total cholesterol
* HbA1c
* hypertension history
* type 2 diabetes history
* creatinine
* systolic blood pressure
* diastolic blood pressure
* smoking history
* smoking quantity

## CVD Outcome Definition

Composite outcome:

* stroke
* myocardial infarction (MI)
* heart failure (HF)

---

# 3. Generate Sample CSV Files

Script location:

```
/home/hmo/LifelinesCSV2CDF/samplecsv/generate_sample_csv_datafiles.py
```

Example usage:

```bash
python rs_fl_variables_csv_gen.py \
  --in /home/hmo/RS_CSV2CDF/data_csv/RS_ergo_tabular_05032023.csv \
  --out /home/hmo/RS_CSV2CDF/data_csv/RS_ergo_tabular_fl_selected_var_population.csv \
  --codebook /home/hmo/RS_CSV2CDF/data_csv/rs_cvd_variables.xlsx
```

---

# 4. Prepare Config File Before CDF Conversion

```bash
python rs_cdf_config_gen.py \
  --csv /home/hmo/RS_CSV2CDF/data_csv/RS_ergo_tabular_fl_selected_var_population.csv \
  --id-col ergoid \
  --ids-out /home/hmo/RS_CSV2CDF/data_csv/ids.csv \
  --config-out /home/hmo/RS_CSV2CDF/data_csv/rs_csv_var_config.json \
  --assessment a1 \
  --csv-normalized-out /home/hmo/RS_CSV2CDF/data_csv/RS_ergo_tabular_with_ppid.csv
```

---

# 5. Convert CSV → CDF

```bash
python -m lifelinescsv_to_icdf.cdfgenerator \
  /home/hmo/RS_CSV2CDF/data_csv/ids.csv \
  /home/hmo/RS_CSV2CDF/data_csv/rs_csv_var_config.json \
  /home/hmo/RS_CSV2CDF/data_cdf
```

CDF output directory:

```
/home/hmo/RS_CSV2CDF/data_cdf
```

---

# 6. Common Predictor Variables (Lifelines)

```
sexe
age
sbp
dbp
HDL_mmol
LDL_mmol_centri
TC_mmol
GFR
creat_umol
smoking
prev_DM
prev_HT
```

---

# 7. Outcome Variables

```
stroke_date
inc_hf_2018
enddat_hf
Inc_MI
enddat_MI
CVD_STATUS
CVD_ONSET_DATE
```

---

# 8. FHIR Transformation

Example commands:

```bash
npm run transform -- ./fhirvalidation/sampleinputs/input-p1234.json -o ./out

npm run transform -- ./fhirvalidation/sampleinputs/input-pa2739b7129c7319d73189273817318973822-follow_up_conditions_w_undefined_onset_date.json -o ./out

npm run transform -- ./fhirvalidation/sampleinputs/input-p675432-hf-diab-followup-missing-date.json -o ./out

npm run transform -- ./fhirvalidation/sampleinputs -o /home/hmo/CDF2Medmij-Mapping-tool/fhirvalidation/temp_out
```

---

# 9. CDF → MedMij FHIR Harmonization (Rotterdam Study)

Working directory:

```
/home/hmo/CDF2Medmij-Mapping-tool/src
```

## Files That Do NOT Need Modification

Reusable generic components:

* functionsCatalog.ts
* inputSingleton.ts
* mapper.ts
* transformationParameters.ts
* unexpectedInputException.ts
* fhir-resource-interfaces/*
* zib-2017-mappings/*.jsonata

These remain dataset‑agnostic.

---

# 10. Rotterdam‑Specific TypeScript Files

```
src/
  rotterdam/
    Patient.ts
    BloodPressure.ts
    HDLCholesterol.ts
    LDLCholesterol.ts
    TotalCholesterol.ts
    eGFR.ts
    Diabetes.ts
    TobaccoUse.ts
    HeartFailure.ts
    Stroke.ts
    MyocardialInfarction.ts
    CardioVascularDisease.ts
    HistoryHTN.ts
    HistoryDM.ts
    HistoryCVD.ts
    rsFunctions.ts
```

---

# 11. Example RS CDF Variables

## IDs / Baseline

```
PROJECT_PSEUDO_ID.a1
date_int_cen.a1
gebdatum.a1
sex_mapped.a1
age_at_baseline_years_derived.a1
```

## Predictors

```
sbp.a1
dbp.a1
HDL_mmol.a1
LDL_mmol_chosen.a1
TC_mmol.a1
GFR.a1
smoking_status.a1
prev_HT_bool.a1
prev_DM_bool.a1
```

## Outcomes

```
incident_mi_bool.a1
incident_mi_date_derived.a1
incident_stroke_bool.a1
incident_stroke_date_derived.a1
incident_hf_bool.a1
incident_hf_date_derived.a1
incident_cvd_composite_bool.a1
incident_cvd_date_derived.a1
```

---

# 12. Age Handling

Age should **NOT** be generated in FHIR mapping.

Instead, compute during feature engineering:

```
age = (baseline_date - birthdate).days / 365.25
```

FHIR represents age indirectly using:

* `birthDate`

Downstream systems compute age when required.

---

# 13. Rotterdam Transform Command

```bash
npm run transform:rotterdam -- \
  /home/hmo/RS_CSV2CDF/data_cdf \
  /home/hmo/RS_CSV2CDF/data_fhir
```

---

# 14. Notes

* The Lifelines federated learning pipeline consumes engineered predictors rather than raw FHIR attributes.
* The CDF → FHIR step is primarily for interoperability and harmonization.
* Dataset‑specific logic should be isolated inside the `rotterdam/` folder to keep the core framework reusable.

---

# 15. Quick Pipeline Summary

```
CSV → Variable Selection → Config Generation → CDF → FHIR → FL Preprocessing → Model
```

---

End of cheat sheet.

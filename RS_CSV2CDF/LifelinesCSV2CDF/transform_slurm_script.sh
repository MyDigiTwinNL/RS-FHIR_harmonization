#!/bin/bash
#SBATCH --job-name=CSV2CDF
#SBATCH --output=csv2cdf.out
#SBATCH --error=csv2cdf.err
#SBATCH --time=02:59:00
#SBATCH --cpus-per-task=1
#SBATCH --mem=4gb
#SBATCH --nodes=1
#SBATCH --open-mode=append
#SBATCH --export=NONE
#SBATCH --get-user-env=L60

module load Python/3.9.1-GCCcore-7.3.0-bare
module list
python -m lifelinescsv_to_icdf.cdfgenerator /home/umcg-hcadavid/temporal-data/csv2csd/ids.csv /home/umcg-hcadavid/temporal-data/csv2csd/csv2csdconfig.json /home/umcg-hcadavid/temporal-data/pheno_lifelines_csd_out

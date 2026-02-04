import pandas as pd
import time
import resource
import json
from typing import Set, Dict, List
import uuid
import argparse
import csv
import os
import sys
import psutil
import logging
import traceback
from .transformation_exceptions import MissingParticipantRowException
from .transformation_exceptions import MoreThanOneValueInAssessmentVariants


# Set the log level to INFO
logging.basicConfig(level=logging.INFO)

#"variant_id"
#  "date":
#  "age"
#  "gender"       
#  "zip_code": 


def load_val(data_frames:Dict[str,pd.core.frame.DataFrame],file:str,col:str,participant_id:str)->int:
    try:
        val = (data_frames[file].loc[participant_id])[col]
        return val;
    except KeyError as ke:
        raise MissingParticipantRowException(ke)    


def load_and_index_csv_datafiles(config_file_path:str) -> Dict[str,pd.core.frame.DataFrame]:

    data_frames:Dict[str,pd.core.frame.DataFrame] = {}

    #load transformation configuration file
    f = open(config_file_path)
    data = json.load(f)
    assessment_variables = data.keys();

    #default set of columns that must be loaded (regardless the configuration)
    default_columns:Set[str] = {'project_pseudo_id'}

    #key: 'file name', value: list of variables to be read in such a file
    required_csv_columns:Dict[str,set] = {}

    datafiles:Set[str] = set()


    #get the CSV files that are needed for the transformation
    for assessment_variable in assessment_variables:
        var_assessment_files = data[assessment_variable]

        #get the files, and their respective columns that need to be read
        for varversion in var_assessment_files:
            filename:str = list(varversion.values())[0]     
            
            datafiles.add(filename)

            if not filename in required_csv_columns:
                required_csv_columns[filename]=default_columns.copy()

            required_csv_columns[filename].add(assessment_variable)

    #create an indexed dataframe for each datafile
    for file in datafiles:
        
        #load only the needed columns
        logging.info(f"Loading and indexing {file}. Columns:{required_csv_columns[file]}")        
        data_frames[file] = pd.read_csv(file,na_filter=False,dtype=str,usecols=required_csv_columns[file]);  
        logging.info(str(data_frames[file]))      
        data_frames[file].set_index('project_pseudo_id',inplace=True)
        data_frames[file] = data_frames[file].sort_values(by='project_pseudo_id')
        process = psutil.Process()
        memory_usage = process.memory_info().rss / 1024 ** 2

        logging.info(f"{file} loaded and indexed. Total memory usage: {memory_usage} MB")

    
    return data_frames
    
    #print(f"Data indexed in {end_load-start_load} ms")




def get_single_non_empty_value(series:pd.core.series.Series)->str:
    variant_values = series.values.tolist()    

    non_empty_values:List = list(filter(lambda element: len(element)>0,variant_values));
    
    if len(non_empty_values) == 0:
        return '';
    elif len(non_empty_values) == 1:
        return non_empty_values[0];
    else:
        raise MoreThanOneValueInAssessmentVariants(f'Two or more values found on an assessment variant:{non_empty_values}');
    


def generate_csd(participant_id:str,config:dict,data_frames:Dict[str,pd.core.frame.DataFrame])->dict:
    assessment_variables = config.keys()
    
    #variables that are on all datafiles
    default_vars = ["project_pseudo_id","variant_id","date","age","gender","zip_code"]

    output = {"project_pseudo_id":{"1a":participant_id}}
    for assessment_variable in assessment_variables:

        var_assessments = {}
        var_assessment_files = config[assessment_variable]

        for varversion in var_assessment_files:
            assessment_name = list(varversion.keys())[0]
            assessment_file = list(varversion.values())[0]                 
            # Return each value encapsulated in quotes

            try:

                
                var_value = load_val(data_frames,assessment_file,assessment_variable,participant_id)

                
                if isinstance(var_value,str):

                    var_str_value = str(var_value);
                    #Missing values (with $X code) will be returned as empty strings (convention on the tools that will use the CDF format)
                    if var_str_value!='' and var_str_value[0]!='$':
                        var_assessments[assessment_name] = var_str_value;
                    else:
                        var_assessments[assessment_name] = "";                        

                # when the datafile has multiple rows with the same pseudo-id (due to having multiple variants of the questionnaire),
                # rather than an string, pandas returns an Series object, with one row for each value.
                # It is expected that only one non-empty element is in the series, except for the default variables.
                elif isinstance(var_value,pd.core.series.Series):
                    logging.debug(f'Processing multiple rows for variable{assessment_variable} in file {assessment_file}')
                    try:
                        #the default variables are always duplicated across multiple variants, the first value is returned.
                        if assessment_variable in default_vars:                            
                            var_assessments[assessment_name] = var_value.values.tolist()[0];
                        else:
                            var_assessments[assessment_name] = get_single_non_empty_value(var_value)
                    except MoreThanOneValueInAssessmentVariants as e:                    
                        logging.error(f"Variable {assessment_variable} has multiple non-empty values for the pseudo_id '{var_value.index.tolist()[0]}' in the file {assessment_file}. Aborting.")
                        os.abort()
                else:
                    logging.error(f"Unsupported type:{type(var_value)} found while processing variable {assessment_variable} in the file {assessment_file}. Aborting");
                    os.abort()

                
            except MissingParticipantRowException as mr:
                #for consistency, the value of a variable a given patient assessment is reported as missing ("") when
                #there is no row for the participant in the datafile
                var_assessments[assessment_name] = ""
                logging.debug(f'Missing row: missing row for participant [{participant_id}] in file [{assessment_file}]  when looking for of variable {assessment_variable} (reported as missing data)')
                        
        output[assessment_variable]=var_assessments

    return output    


def load_ids(ids_file)->List[str]:
    content_list:List[str] = []

    with open(ids_file, 'r') as f:
        reader = csv.reader(f)
        next(reader) # skip header
        content_list = [row[0] for row in reader]
    
    return content_list


def main():
    # Create the command-line argument parser
    parser = argparse.ArgumentParser(description='Transform Lifelines CSV files into CDF (cohort-data JSON format).')

    # Add the command-line arguments
    parser.add_argument('ids_file', help='Path to the CSV file with a list of IDs.')
    parser.add_argument('config_file', help='Path to the JSON configuration file.')
    parser.add_argument('output_folder', help='Path to the output folder.')

    # Parse the command-line arguments
    args = parser.parse_args()

    if not os.path.isfile(args.ids_file):
        print(f"The specified file path '${args.ids_file}' does not exist.")
        return

    if not os.path.isfile(args.config_file):
        print(f"The specified file path '${args.config_file}' does not exist.")
        return

    # if not os.path.exists(args.output_folder):
    #     print(f"The specified output folder path '${args.output_folder}' does not exist.")
    #     return


    if not os.path.exists(args.output_folder):
        os.makedirs(args.output_folder)

    #load rows identifiers and transformation configuration settings
    
    load_start_time = time.time()
    ids = load_ids(args.ids_file)
    data_frames = load_and_index_csv_datafiles(args.config_file)
    load_end_time = time.time()

    logging.info(f"{len(data_frames)} CSV files loaded and indexed in {load_end_time - load_start_time} seconds.")

    process = psutil.Process()
    memory_usage = process.memory_info().rss / 1024 ** 2

    logging.info(f"Total memory usage: {memory_usage} MB")


    config_file = open(args.config_file)
    config_params = json.load(config_file)

    progress_count = 0;


    process_start_time = time.time()
    for id in ids:
        try:
            participant_data = generate_csd(id,config_params,data_frames)
            output_file = os.path.join(args.output_folder,id+".cdf.json")        
            with open(output_file, 'w') as json_file:
                json.dump(participant_data, json_file)
            progress_count += 1
            if progress_count%100==0:
                process_end_time = time.time()
                logging.info(f'{progress_count} files processed. Elapsed time: {process_end_time - process_start_time} sec ({progress_count/(process_end_time - process_start_time)} rows/s)')
        except Exception as e:
            traceback.print_exc()
            process_end_time = time.time()
            print(f"An error occurred after processing {progress_count} rows: {str(e)}. Time elapsed: {process_end_time - process_start_time} sec.")               
            sys.exit(1)     

    process_end_time = time.time()
    print(f"{progress_count} files created on {args.output_folder} in {process_end_time - process_start_time} sec.")   

if __name__ == '__main__':
    main()

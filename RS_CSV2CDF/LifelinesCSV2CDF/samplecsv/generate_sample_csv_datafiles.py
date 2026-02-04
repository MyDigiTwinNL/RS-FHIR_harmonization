import csv
import random
import string
import uuid
import argparse
import os
import sys

# Generate a unique ID string
def generate_unique_id(rownum:int) -> str:
    return '"'+str(uuid.uuid3(uuid.NAMESPACE_DNS,"row"+str(rownum)))[:15]+'"'

# Generate the CSV file
def generate_csv_file(filename:str, num_columns:int, num_rows:int):
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_NONE, quotechar='', escapechar='\\')
        
        # Write header row
        header = ['"'+'project_pseudo_id'+'"'] + ['"'+f"Column{i}"+'"' for i in range(2, num_columns + 1)]
        writer.writerow(header)
        
        # Write data rows
        for i in range(num_rows):
            if i%10000 == 0: print(f"{i} rows added")
            row = [generate_unique_id(i)]  # ID column
            
            for j in range(2, num_columns + 1):
                if j % 7 == 0:
                    row.append("")
                elif j % 11 == 0:
                    row.append("$6")          
                elif j % 5 == 0:                    
                    row.append('"'+str(random.randint(1, 100))+'"')
                else:
                    row.append('"'+str(random.choice([1, 2]))+'"')
                    
            writer.writerow(row)
        
        print(f"CSV file '{filename}' generated successfully.")


# Generate IDs file
def generate_ids_file(filename:str, num_rows:int):
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_NONE, quotechar='', escapechar='\\')
        
        # Write header row
        header = ['project_pseudo_id']
        writer.writerow(header)
        
        # Write data rows
        for i in range(num_rows):
            if i%10000 == 0: print(f"{i} rows added")
            row = [generate_unique_id(i)]  # ID column                                            
            writer.writerow(row)
        
        print(f"IDs CSV file '{filename}' generated successfully.")



def main():
    parser = argparse.ArgumentParser(description='Sample CSV datafiles generator.')
    parser.add_argument('num_files', type=int, help='Number of CSV files to generate')
    parser.add_argument('num_columns', type=int, help='Number of columns in each CSV file')
    parser.add_argument('num_rows', type=int, help='Number of rows in each CSV file')
    parser.add_argument('-o', '--output', type=str, default='./bigfiles', help='Output folder path')
    args = parser.parse_args()

    num_files = args.num_files
    num_columns = args.num_columns
    num_rows = args.num_rows
    output_folder = args.output

    if num_files is None or num_columns is None or num_rows is None:
        parser.print_help()
        sys.exit(1)

    # Get the absolute path of the folder containing this script
    # Set the output folder at './bigfiles' (currently in git's .gitignore)
    current_path = os.path.abspath(os.path.dirname(__file__))

    # If a custom output folder is provided, use it; otherwise, use the default './bigfiles'
    if output_folder != './bigfiles':
        output_folder = os.path.abspath(output_folder)
    else:
        output_folder = os.path.abspath(os.path.join(current_path, 'bigfiles'))

    # create output folder if it does not exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    generate_ids_file(os.path.abspath(os.path.join(output_folder, 'pseudo_ids.csv')), num_rows)

    for i in range(num_files):
        generate_csv_file(
            os.path.abspath(os.path.join(output_folder, f'a{i+1}_data.csv')),
            num_columns,
            num_rows
        )

if __name__ == '__main__':
    main()
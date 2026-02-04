import unittest
import pandas as pd
from lifelinescsv_to_icdf import cdfgenerator
from typing import Set, Dict, List

# Define class to test the program
class CSVFilesToCDF(unittest.TestCase):

    def test_transformation_with_complete_data(self):      

        #Dataframes indexed by project_pseudo_id
        file_a = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['1'           ,'5'          ,'7'],
                               'var2':  ['2'           ,'5'          ,'6']}
        file_b = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['20'          ,'90'          ,'70'],
                               'var2':  ['12'          ,'15'          ,'26'],
                               'varN':  ['2001-1'      ,'2001-2'      ,'2001-3']}                
        file_c = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['100'         ,'500'         ,'700'],
                               'var2':  ['200'         ,'500'         ,'600']}

        df_dict:Dict[str,pd.core.frame.DataFrame]=dict()

        df_dict['file_a'] = pd.DataFrame(data=file_a)
        df_dict['file_a'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_b'] = pd.DataFrame(data=file_b)
        df_dict['file_b'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_c'] = pd.DataFrame(data=file_c)
        df_dict['file_c'].set_index('project_pseudo_id',inplace=True)


        #Configuration file
        config = {}

        config['var1'] = [{"1a":'file_a'},{'1b':'file_b'},{'1c':'file_c'}]
        config['var2'] = [{"3a":'file_a'},{'3b':'file_b'},{'3c':'file_c'}]
        config['varN'] = [{"general":'file_b'}]


        expected_output_participantA = {
            'project_pseudo_id':{"1a":'participantA'},
            'var1':{"1a":"1","1b":"20","1c":"100"},
            'var2':{"3a":"2","3b":"12","3c":"200"} ,
            'varN':{"general":"2001-1"}    
        }

        expected_output_participantC = {
            'project_pseudo_id':{"1a":'participantC'},
            'var1':{"1a":"7","1b":"70","1c":"700"},
            'var2':{"3a":"6","3b":"26","3c":"600"},
            'varN':{"general":"2001-3"}         
        }
  
        self.assertEqual(cdfgenerator.generate_csd('participantA',config,df_dict),expected_output_participantA,"CSV to CDF transformation not generating the expected output.")
        self.assertEqual(cdfgenerator.generate_csd('participantC',config,df_dict),expected_output_participantC,"CSV to CDF transformation not generating the expected output.")


    def test_transformation_with_missing_value_codes(self):      

        #Dataframes indexed by project_pseudo_id
        file_a = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':['$4'           ,'5'          ,'7'],
                  'var2':['2'           ,'5'          ,'6']}
        file_b = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':['20'          ,'90'          ,'$5'],
                  'var2':['12'          ,'15'          ,'26']}
        file_c = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':['100'         ,'500'         ,'$6'],
                  'var2':['$7'         ,'500'         ,'600']}

        df_dict:Dict[str,pd.core.frame.DataFrame]=dict()

        df_dict['file_a'] = pd.DataFrame(data=file_a)
        df_dict['file_a'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_b'] = pd.DataFrame(data=file_b)
        df_dict['file_b'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_c'] = pd.DataFrame(data=file_c)
        df_dict['file_c'].set_index('project_pseudo_id',inplace=True)


        #Configuration file
        config = {}

        config['var1'] = [{"1a":'file_a'},{'1b':'file_b'},{'1c':'file_c'}]
        config['var2'] = [{"3a":'file_a'},{'3b':'file_b'},{'3c':'file_c'}]

        expected_output_participantA = {
            'project_pseudo_id':{"1a":'participantA'},
            'var1':{"1a":"","1b":"20","1c":"100"},
            'var2':{"3a":"2","3b":"12","3c":""}     
        }
  
        expected_output_participantC = {
            'project_pseudo_id':{"1a":'participantC'},
            'var1':{"1a":"7","1b":"","1c":""},
            'var2':{"3a":"6","3b":"26","3c":"600"}     
        }
                
        self.assertEqual(cdfgenerator.generate_csd('participantA',config,df_dict),expected_output_participantA,"CSV (with missing values) to CDF transformation not generating the expected output.")
        self.assertEqual(cdfgenerator.generate_csd('participantC',config,df_dict),expected_output_participantC,"CSV (with missing values) to CDF transformation not generating the expected output.")


    def test_transformation_with_missing_values(self):      

        #Dataframes indexed by project_pseudo_id
        file_a = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':[''           ,'5'          ,'7'],
                  'var2':['2'           ,'5'          ,'6']}
        file_b = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':['20'          ,'90'          ,''],
                  'var2':['12'          ,'15'          ,'26']}
        file_c = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                  'var1':['100'         ,'500'         ,''],
                  'var2':[''         ,'500'         ,'600']}

        df_dict:Dict[str,pd.core.frame.DataFrame]=dict()

        df_dict['file_a'] = pd.DataFrame(data=file_a)
        df_dict['file_a'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_b'] = pd.DataFrame(data=file_b)
        df_dict['file_b'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_c'] = pd.DataFrame(data=file_c)
        df_dict['file_c'].set_index('project_pseudo_id',inplace=True)


        #Configuration file
        config = {}

        config['var1'] = [{"1a":'file_a'},{'1b':'file_b'},{'1c':'file_c'}]
        config['var2'] = [{"3a":'file_a'},{'3b':'file_b'},{'3c':'file_c'}]

        expected_output_participantA = {
            'project_pseudo_id':{"1a":'participantA'},
            'var1':{"1a":"","1b":"20","1c":"100"},
            'var2':{"3a":"2","3b":"12","3c":""}     
        }
  
        expected_output_participantC = {
            'project_pseudo_id':{"1a":'participantC'},
            'var1':{"1a":"7","1b":"","1c":""},
            'var2':{"3a":"6","3b":"26","3c":"600"}     
        }


                
        self.assertEqual(cdfgenerator.generate_csd('participantA',config,df_dict),expected_output_participantA,"CSV (with missing values) to CDF transformation not generating the expected output.")
        self.assertEqual(cdfgenerator.generate_csd('participantC',config,df_dict),expected_output_participantC,"CSV (with missing values) to CDF transformation not generating the expected output.")




    def test_transformation_with_dropped_participants(self):      

        #Dataframes indexed by project_pseudo_id
        file_a = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['1'           ,'5'          ,'7'],
                               'var2':  ['2'           ,'5'          ,'6']}
        file_b = {'project_pseudo_id':  ['participantB','participantC'],
                               'var1':  ['90'          ,'70'],
                               'var2':  ['15'          ,'26']}
        file_c = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['100'         ,'500'         ,'700'],
                               'var2':  ['200'         ,'500'         ,'600']}


        df_dict:Dict[str,pd.core.frame.DataFrame]=dict()

        df_dict['file_a'] = pd.DataFrame(data=file_a)
        df_dict['file_a'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_b'] = pd.DataFrame(data=file_b)
        df_dict['file_b'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_c'] = pd.DataFrame(data=file_c)
        df_dict['file_c'].set_index('project_pseudo_id',inplace=True)


        #Configuration file
        config = {}

        config['var1'] = [{"1a":'file_a'},{'1b':'file_b'},{'1c':'file_c'}]
        config['var2'] = [{"3a":'file_a'},{'3b':'file_b'},{'3c':'file_c'}]

        # If a participant is not included on a particular file (e.g., dropped the study), this will be
        # reported as a missign value

        #1b and 3b of 'var1' and 'var2' (which are on 'file_b') are not included for participantA's row, 
        # as there is no row for him on 'file_b'
        expected_output_participantA = {
            'project_pseudo_id':{"1a":'participantA'},
            'var1':{"1a":"1","1b":"","1c":"100"},
            'var2':{"3a":"2","3b":"","3c":"200"}     
        }

  
        expected_output_participantC = {
            'project_pseudo_id':{"1a":'participantC'},
            'var1':{"1a":"7","1b":"70","1c":"700"},
            'var2':{"3a":"6","3b":"26","3c":"600"}     
        }
                
        self.assertEqual(cdfgenerator.generate_csd('participantA',config,df_dict),expected_output_participantA,"CSV (with missing values) to CDF transformation not generating the expected output.")
        self.assertEqual(cdfgenerator.generate_csd('participantC',config,df_dict),expected_output_participantC,"CSV (with missing values) to CDF transformation not generating the expected output.")



    def test_transformation_with_multiple_questionnarie_variants(self):      
        """""
        
        """
        #Dataframes indexed by project_pseudo_id, multiple rows with the same id ('participantA')
        file_a = {'project_pseudo_id':  ['participantA','participantA','participantA','participantB','participantC'],
                         'variant_id':  ['vr1'         ,'vr2'         ,'vr3'         ,'vr1'         ,'vr1'],
                               'var1':  [''            ,'1'           ,''            ,'5'           ,'7'],
                               'var2':  [''            ,''            ,'2'           ,'5'           ,'6']}
        file_b = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['20'          ,'90'          ,'70'],
                               'var2':  ['12'          ,'15'          ,'26']}
        file_c = {'project_pseudo_id':  ['participantA','participantB','participantC'],
                               'var1':  ['100'         ,'500'         ,'700'],
                               'var2':  ['200'         ,'500'         ,'600']}

        df_dict:Dict[str,pd.core.frame.DataFrame]=dict()

        df_dict['file_a'] = pd.DataFrame(data=file_a)
        df_dict['file_a'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_b'] = pd.DataFrame(data=file_b)
        df_dict['file_b'].set_index('project_pseudo_id',inplace=True)

        df_dict['file_c'] = pd.DataFrame(data=file_c)
        df_dict['file_c'].set_index('project_pseudo_id',inplace=True)


        #Configuration file
        config = {}

        config['var1'] = [{"1a":'file_a'},{'1b':'file_b'},{'1c':'file_c'}]
        config['var2'] = [{"3a":'file_a'},{'3b':'file_b'},{'3c':'file_c'}]

        expected_output_participantA = {
            'project_pseudo_id':{"1a":'participantA'},
            'var1':{"1a":"1","1b":"20","1c":"100"},
            'var2':{"3a":"2","3b":"12","3c":"200"}     
        }

        expected_output_participantC = {
            'project_pseudo_id':{"1a":'participantC'},
            'var1':{"1a":"7","1b":"70","1c":"700"},
            'var2':{"3a":"6","3b":"26","3c":"600"}     
        }
  
        self.assertEqual(cdfgenerator.generate_csd('participantA',config,df_dict),expected_output_participantA,"CSV to CDF transformation not generating the expected output.")
        self.assertEqual(cdfgenerator.generate_csd('participantC',config,df_dict),expected_output_participantC,"CSV to CDF transformation not generating the expected output.")



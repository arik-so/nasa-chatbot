''' A python script for reversing geocodes from a csv file
to human-readable city and country names

Current limitation: query limits '''

import pandas as pd
import numpy as np
import os
import requests
import json

cwd = os.getcwd()

''' Create a dict of 2-alpha country codes and country names '''
cc_path = os.path.join(cwd, "country_codes.csv")
cc_df = pd.read_csv(cc_path)
cc_dict = dict(zip(cc_df.code, cc_df.name))

''' Begin working on main dataset '''
main_path = os.path.join(cwd, "nasa_usa_fire_data_7d_cities.csv")
main_df = pd.read_csv(main_path)
write_df = pd.read_csv(main_path)
write_path = os.path.join(cwd, 'nasa_usa_fire_data_7d_cities_countries.csv')

''' Make query for either country or city at a time but not both
to avoid ValueError raised by pandas (arrays of different lengths) '''
country = []
#city = []
iter_index = 0

url = "http://api.geonames.org/countryCode?lat={}&lng={}&username=unchitta"
#url = "http://scatter-otl.rhcloud.com/location?lat={}&long={}"

with open('log.txt', 'a') as f:

    # loop through each row in main dataset and make a query
    try: 
        for index, row in main_df.iterrows():
            response = requests.get(url.format(row[0],row[1]))
            response = response.text.strip()
            print(response+" ")
            if (response == ''):
                country.append("Unknown Country")
            else:   # get country name from the dict with the key returned from query
                country.append(cc_dict.get(response, "Unknown Country"))
            
            '''
            response = requests.get(url.format(row[0],row[1]))
            if (response.text == ''):
                city.append("Unknown City")
            else:
                city.append(response.json().get('city', "Unknown City"))
            '''
            
            iter_index += 1

    # keep track of row # in case errors occurs
    except Exception as e:
        f.write('{}\n'.format(iter_index))
        f.write(str(e))

    ''' merge the existing dataset with new country or city
    column then write to a new .csv file '''
    finally:
        new_col = pd.DataFrame({'country': country}) #change to {'city':city} for cities
        write_df = write_df.merge(new_cols, left_index=True, right_index=True)
        write_df.to_csv(write_path, index=False)
        
        

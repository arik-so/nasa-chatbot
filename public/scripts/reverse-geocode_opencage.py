import requests
from time import sleep
from time import time

COLUMN_SEPARATOR = ","

start_index = 152

with open('/Users/nitinp/Projects/nasa-chatbot/data/raw/nasa_usa_fire_data_7d.csv', 'r') as f:
    with open('/Users/nitinp/Projects/nasa-chatbot/data/raw/nasa_usa_fire_data_7d_f.csv', 'a') as o:
        inp_lines = f.read().splitlines()
        try:
            for line in inp_lines[start_index:]:
                lat, lng = map(lambda n: float(n), line.split(COLUMN_SEPARATOR)[:2])
                resp = requests.get(
                    "https://api.opencagedata.com/geocode/v1/json?q={},{}&pretty=1&key=f2f01a8d51de70ccfe545ad622587d60".format(
                        lat, lng))
                geo_info = resp.json()['results'][0]['components']
                line += COLUMN_SEPARATOR.join(
                    [geo_info.get("city", "Unknown City"), geo_info.get("state", "Unknown State"),
                     geo_info.get("country", "Unknown Country")])
                o.write(line + "\n")
                start_index += 1
                sleep(1)
                if start_index % 100 is 0:
                    print "{}: Completed {}".format(time(), start_index)
        except Exception as e:
            print 'Parsed {} lines'.format(start_index)

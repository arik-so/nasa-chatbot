# Maxed out at 1500 and only produced 274 results

from time import sleep
from time import time
import requests
import traceback


def example(lat, lng):
    # grab some lat/long coords from wherever. For this example,
    # I just opened a javascript console in the browser and ran:
    #
    # navigator.geolocation.getCurrentPosition(function(p) {
    #   console.log(p);
    # })
    #
    latitude = lat
    longitude = lng

    # Did the geocoding request comes from a device with a
    # location sensor? Must be either true or false.
    sensor = 'true'

    # Hit Google's reverse geocoder directly
    # NOTE: I *think* their terms state that you're supposed to
    # use google maps if you use their api for anything.
    base = "http://maps.googleapis.com/maps/api/geocode/json?"
    params = "latlng={lat},{lon}&sensor={sen}".format(
        lat=latitude,
        lon=longitude,
        sen=sensor
    )
    url = "{base}{params}".format(base=base, params=params)
    response = requests.get(url).json()['results']
    if len(response) > 0:
        response = response[0]['address_components']
        return [response[2]['long_name'], response[3]['long_name'], response[4]['long_name'], response[5]['long_name']]


COLUMN_SEPARATOR = ","

start_index = 0

with open('/Users/nitinp/Projects/nasa-chatbot/data/raw/nasa_usa_fire_data_7d.csv', 'r') as f:
    with open('/Users/nitinp/Projects/nasa-chatbot/data/raw/nasa_usa_fire_data_7d_f1.csv', 'w') as o:
        inp_lines = f.read().splitlines()
        for line in inp_lines[start_index:]:
            try:
                lat, lng = map(lambda n: float(n), line.split(COLUMN_SEPARATOR)[:2])
                resp = example(lat, lng)
                if resp:
                    line += COLUMN_SEPARATOR.join(resp)
                    o.write(line + "\n")
                else:
                    print 'Unknown lat, lng = ({}, {})'.format(lat, lng)
                start_index += 1
                sleep(0.01)
                if start_index % 100 is 0:
                    print "{}: Completed {}".format(time(), start_index)
            except Exception as e:
                traceback.print_exc()
                print 'Parsed {} lines'.format(start_index)

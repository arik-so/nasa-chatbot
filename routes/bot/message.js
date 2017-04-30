/**
 * Created by arik on 4/29/16.
 */
const models = require(process.root + 'models');
const path = require('path');
var ChatController = require(process.root + 'controllers/chat');
var Promise = require('bluebird');
var assert = require('assert');
const request = require('request-promise');
const apiai = require('apiai-promise')(process.env.API_AI_TOKEN);
const LIMIT = 100;

module.exports = Promise.coroutine(function *(req, res, text) {

  let messengerUser = req.messengerUser;
  const aiResponse = yield apiai.textRequest(text, { sessionId: messengerUser.messengerID });

  const dbResults = yield searchDB(aiResponse.result.parameters);
  const newResponse = prepareResponse(dbResults, aiResponse.result.parameters, aiResponse.resolvedQuery);
  console.log(`Sending to chat bot, "${dbResults}"`);
  const payload = { text: newResponse };
  try {
    yield ChatController.sendMessage(messengerUser, payload);
  } catch (e) {
    console.trace(e);
  }

});
/**
 * Prepare a response to user
 * @param results: DB rows
 * @param params: api.ai parameters object
 * @param userQuery: English sentence sent by the user
 * @returns {string}: Response to be sent to bot
 */
function prepareResponse(results, params, userQuery) {
  if (!results) {
    return 'Sorry, could you ask something more specific?'
  }
  let total = results.length;
  let response = "";
  if (total === LIMIT) {
    response = `There are more than a ${LIMIT} of them. Here is the worst one, ${JSON.stringify(results[0].toJSON())}`;
  }
  else if (total === 0) {
    response = `OOPS! Nothing found based on what you asked. I only know about the fires in USA from April 22, 2017. Try asking more generic questions`;
  }
  else {
    response = `There are ${LIMIT} of them. Here is the worst one, ${JSON.stringify(results[0].toJSON())}`;
  }
  console.log(response);
  return response;
}

const searchDB = Promise.coroutine(function *(params) {
  // brightness - bright, strongest, weakest - 200 to 400
  // Moment - Night, Day, Today, Last night, Past
  // date - Apr 22 to Apr 29          2014-08-09
  // date-period                      2014-01-01/2014-12-31
  // geo-city, geo-city-us            Paris
  // geo-country                      United States of America
  // geo-state-us                     California
  // continent                        Asia
  const conditions = {};

  let brightness_condition = (params.brightness || "").toLocaleLowerCase().trim();
  if (brightness_condition.length > 0) {
    switch (brightness_condition) {
      case "strongest":
        conditions.brightness = { gt: 350 };
        break;
      case "bright":
        conditions.brightness = { between: [250, 350] };
        break;
      case "weakest":
        conditions.brightness = { lt: 250 };
        break;
      default:
        break;
    }
  }

  let moment_condition = (params.Moment || "").toLocaleLowerCase().trim();
  if (moment_condition.length > 0) {
    switch (moment_condition) {
      case "night":
        conditions.daynight = 'N';
        break;
      case "last night":
        let today = new Date();
        let yesterday = today.setDate(today.getDate() - 1);
        conditions.acq_date = dbDateFormat(yesterday);
        conditions.daynight = 'N';
        break;
      case "day":
        conditions.daynight = 'D';
        break;
      case "today":
        conditions.acq_date = dbDateFormat();
        break;
      case "past":
        conditions.acq_date = { lt: dbDateFormat() };
        break;
      default:
        break;
    }
  }

  let date_condition = (params.date || "").toLocaleLowerCase().trim();
  if (date_condition.length > 0) {
    conditions.acq_date = date_condition;
  }

  let date_period_condition = (params['date-period'] || "").toLocaleLowerCase().trim();
  if (date_period_condition.length > 0) {
    let [from_date, to_date] = date_period_condition.split("/");
    conditions.acq_date = {
      between: [
        from_date || dbDateFormat(),
        to_date || dbDateFormat()
      ]
    };
  }

  let city_condition = (params['geo-city-us'] || params['geo-city'] || "").toLocaleLowerCase().trim();
  if (city_condition.length > 0) {
    // look up google's location details
    const lookupUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city_condition)}&key=${process.env.GOOGLE_API_TOKEN}`;
    const lookupResult = yield request({ url: lookupUrl, json: true });
    if (lookupResult && lookupResult.results && lookupResult.results.length > 0) {
      const bounds = lookupResult.results[0].geometry.bounds;
      conditions.latitude = {
        between: [bounds.northeast.lat, bounds.southwest.lat]
      };
      conditions.longitude = {
        between: [bounds.northeast.lng, bounds.southwest.lng]
      };
    }
  }

  let country_condition = (params['geo-country'] || "").toLocaleLowerCase().trim();
  if (country_condition.length > 0) {
    conditions.country = country_condition;
  }


  // let state_condition = (params['geo-state-us'] || "").toLocaleLowerCase().trim();
  // if (state_condition.length > 0) {
  //     conditions.push(`LOWER(state) = '${state_condition}'`);
  // }

  // TODO: Uncomment only if continent information is added to DB
  // let continent_condition = (params['continent'] || "").toLocaleLowerCase().trim();
  // if (continent_condition.length > 0) {
  //     conditions.push(`LOWER(continent) = ${continent_condition}`);
  // }

  if (Object.keys(conditions).length > 0) {
    // get the sequelize model
    return models.Wildfire.findAll({ where: conditions });
  }
  return null;
});

function dbDateFormat(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
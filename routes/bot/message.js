/**
 * Created by arik on 4/29/16.
 */
const models = require(process.root + 'models');
const path = require('path');
var ChatController = require(process.root + 'controllers/chat');
var Promise = require('bluebird');
var assert = require('assert');
const apiai = require('apiai-promise')(process.env.API_AI_TOKEN);
const Q = require('q');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'nasa-chatbot'
});

module.exports = Promise.coroutine(
    function *(req, res, text) {

        let messengerUser = req.messengerUser;
        const aiResponse = yield apiai.textRequest(text, {sessionId: messengerUser.messengerID});

        const aiResponseText = aiResponse.result.fulfillment.speech;
        searchDB(aiResponse.result.parameters).then(function (res) {
            console.log(`Sending to chat bot, "${res}"`);
            const payload = {text: res};
            try {
                ChatController.sendMessage(messengerUser, payload);
            } catch (e) {
                console.trace(e);
            }
            console.log('here');
        }).catch(function (error) {
            console.log('Error in promise', error)
        });


    });

function searchDB(params) {
    // brightness - bright, strongest, weakest - 200 to 400
    // Moment - Night, Day, Today, Last night, Past
    // date - Apr 22 to Apr 29          2014-08-09
    // date-period                      2014-01-01/2014-12-31
    // geo-city, geo-city-us            Paris
    // geo-country                      United States of America
    // geo-state-us                     California
    // continent                        Asia
    let deferred = Q.defer();
    let conditions = [];

    let brightness_condition = (params.brightness || "").toLocaleLowerCase().trim();
    if (brightness_condition.length > 0) {
        switch (brightness_condition) {
            case "strongest":
                conditions.push(`brightness > 350`);
                break;
            case "bright":
                conditions.push(`brightness BETWEEN 250 AND 350`);
                break;
            case "weakest":
                conditions.push(`brightness < 250`);
                break;
            default:
                break;
        }
    }

    let moment_condition = (params.Moment || "").toLocaleLowerCase().trim();
    if (moment_condition.length > 0) {
        switch (moment_condition) {
            case "night":
                conditions.push(`daynight = 'N'`);
                break;
            case "last night":
                let today = new Date();
                let yesterday = today.setDate(today.getDate() - 1);
                conditions.push(`acq_date = ${dbDateFormat(yesterday)}`);
                conditions.push(`daynight = 'N'`);
                break;
            case "day":
                conditions.push(`daynight = 'D'`);
                break;
            case "today":
                conditions.push(`acq_date = ${dbDateFormat()}`);
                break;
            case "past":
                conditions.push(`acq_date < ${dbDateFormat()}`);
                break;
            default:
                break;
        }
    }

    let date_condition = (params.date || "").toLocaleLowerCase().trim();
    if (date_condition.length > 0) {
        conditions.push(`acq_date = ${date_condition}`);
    }

    let date_period_condition = (params['date-period'] || "").toLocaleLowerCase().trim();
    if (date_period_condition.length > 0) {
        let [from_date, to_date] = date_period_condition.split("/");
        conditions.push(`acq_date BETWEEN ${from_date || dbDateFormat()} AND ${to_date || dbDateFormat()}`);
    }

    let city_condition = (params['geo-city-us'] || params['geo-city'] || "").toLocaleLowerCase().trim();
    if (city_condition.length > 0) {
        conditions.push(`LOWER(city) = '${city_condition}'`);
    }

    let country_condition = (params['geo-country'] || "").toLocaleLowerCase().trim();
    if (country_condition.length > 0) {
        conditions.push(`LOWER(country) = '${country_condition}'`);
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

    const LIMIT = 100;
    const TABLE_NAME = 'wildfire';
    if (conditions.length > 0) {
        const query = `SELECT brightness, acq_date, acq_time, city, country FROM ${TABLE_NAME} WHERE ${conditions.join(" AND ") } ORDER BY brightness DESC LIMIT ${LIMIT}`;
        connection.connect(); // TODO: BAD Way. Open once and use many times
        connection.query(query, function (error, results, fields) {
            if (error) {
                deferred.reject(new Error(error));
            } else {
                let total = results.length;
                let response = "";
                if (total === LIMIT) {
                    response = `There are more than a ${LIMIT} of them. Here is the worst one, ${JSON.stringify(results[0])}`;
                }
                else if (total === 0) {
                    response = `OOPS! Nothing found based on what you asked. Try asking more generic questions`;
                }
                else {
                    response = `There are ${LIMIT} of them. Here is the worst one, ${JSON.stringify(results[0])}`;
                }
                console.log(response);
                deferred.resolve(response);
            }
        });
        connection.end();
    }
    else {
        window.setTimeout(() => deferred.resolve("Can you ask something more specific?"), 0);
    }
    return deferred.promise;
}

function dbDateFormat(d = new Date()) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
/**
 * Created by arik on 4/29/16.
 */
const models = require(process.root + 'models');
var ChatController = require(process.root + 'controllers/chat');
var Promise = require('bluebird');
var assert = require('assert');
const apiai = require('apiai-promise')(process.env.API_AI_TOKEN);

module.exports = Promise.coroutine(
function *(req, res, text){

  var messengerUser = req.messengerUser;
  const aiResponse = yield apiai.textRequest(text, { sessionId: messengerUser.messengerID });

  const aiResponseText = aiResponse.result.fulfillment.speech;
  const payload = {
    text: aiResponseText
  };

  try {
    var response = yield ChatController.sendMessage(messengerUser, payload);
  } catch (e) {
    console.trace(e);
  }
  console.log('here');

});
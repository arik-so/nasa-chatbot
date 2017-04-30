var express = require('express');
var router = express.Router();

var models = require(process.root + 'models');
var ChatController = require(process.root + 'controllers/chat');
var postbackRoute = require(process.root + 'routes/bot/postback');
var messageRoute = require(process.root + 'routes/bot/message');

var Promise = require('bluebird');

router.get('/', function(req, res, next) {
  if (req.query['hub.verify_token'] === process.env.MESSENGER_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});

router.post('/', Promise.coroutine(
function *messengerWebhook(req, res) {
  res.sendStatus(200);
  const messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;

    // we have a sender
    // let's see if we have a database object, nd create it if we don't
    var result = yield models.MessengerUser.findOrCreate({ where: { messengerID: sender } });
    req.messengerUser = result[0];

    if (event.postback && event.postback.payload) {

      var postback = JSON.parse(event.postback.payload);
      postbackRoute(req, res, postback);

    } else if (event.message && event.message.text) {

      text = event.message.text;
      messageRoute(req, res, text);

    }
  }

}));

module.exports = router;

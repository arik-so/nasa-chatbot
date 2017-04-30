var express = require('express');
var router = express.Router();

var Promise = require('bluebird');
var request = require('request-promise');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'NASA Data Concierge' });
});

module.exports = router;

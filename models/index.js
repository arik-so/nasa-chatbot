/**
 * Created by arik on 4/29/16.
 */

var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, { logging: console.log });
var db = {};

fs
.readdirSync(__dirname)
.filter(function(file) {
  return (file.indexOf(".") !== 0) && (file !== "index.js");
})
.forEach(function(file) {
  var model = sequelize.import(path.join(__dirname, file));
  db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
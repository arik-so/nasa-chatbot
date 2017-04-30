"use strict";

module.exports = function(sequelize, DataTypes) {
  const Wildfire = sequelize.define('Wildfire', {
    latitude: { type: DataTypes.CHAR, unique: false, allowNull: true },
    longitude: { type: DataTypes.CHAR, unique: false, allowNull: true },
    brightness: { type: DataTypes.FLOAT, unique: false, allowNull: true },
    scan: { type: DataTypes.FLOAT, unique: false, allowNull: true },
    track: { type: DataTypes.FLOAT, unique: false, allowNull: true },
    acq_date: { type: DataTypes.DATEONLY, unique: false, allowNull: true },
    acq_time: { type: DataTypes.INTEGER, unique: false, allowNull: true },
    satellite: { type: DataTypes.CHAR, unique: false, allowNull: true },
    confidence: { type: DataTypes.CHAR, unique: false, allowNull: true },
    version: { type: DataTypes.CHAR, unique: false, allowNull: true },
    bright_ti5: { type: DataTypes.FLOAT, unique: false, allowNull: true },
    frp: { type: DataTypes.INTEGER, unique: false, allowNull: true },
    daynight: { type: DataTypes.CHAR, unique: false, allowNull: true },
    city: { type: DataTypes.CHAR, unique: false, allowNull: true },
    country: { type: DataTypes.CHAR, unique: false, allowNull: true },
  }, {
    classMethods: {
      associate: function(models) {
        // allows to build relations
        // MessengerUser.hasMany(models.BitgoUser);
      }
    }
  });

  // we don't have an ID field
  Wildfire.removeAttribute('id');
  Wildfire.removeAttribute('createdAt');
  Wildfire.removeAttribute('updatedAt');

  return Wildfire;
};
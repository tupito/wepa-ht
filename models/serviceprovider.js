const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ServiceProvider = sequelize.define('serviceProvider', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = ServiceProvider;

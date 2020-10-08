const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// If you don't define a primaryKey then sequelize uses id by default.
const Client = sequelize.define('client', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Client;

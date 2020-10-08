const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');
const Client = require('./client');
const ServiceProvider = require('./serviceprovider');

// https://sequelize.org/master/manual/assocs.html#implementation-3
const Reservation = sequelize.define('reservation', {
  start: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  clientid: {
    type: DataTypes.INTEGER,
    references: { // Liitetään clientid-kenttä Client-modelin id-kenttään
      model: Client,
      key: 'id',
    },
  },
  serviceproviderid: {
    type: DataTypes.INTEGER,
    references: { // Liitetään serviceid-kenttä ServiceProvider-modelin id-kenttään
      model: ServiceProvider,
      key: 'id',
    },
  },
});

module.exports = Reservation;

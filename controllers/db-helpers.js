// Database connection
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');

// Sequelize models
const Client = require('../models/client');
const ServiceProvider = require('../models/serviceprovider');
const Reservation = require('../models/reservation');

// Testing db connection
async function testDBConnection() {
  console.log('Testing DB connection..');

  try {
    await sequelize.authenticate();
    console.log('DB connection ok.');
  } catch (error) {
    console.error('DB connection nok:', error);
  }
}

// Model synchronization to db
async function synchronizeDBModels() {
  console.log('Syncing..');
  // https://sequelize.org/master/manual/model-basics.html#model-synchronization
  await sequelize.sync({ force: true }) // Force droppaa tablet
    .then(() => {
      // Assosisaatiot
      // https://sequelize.org/master/manual/assocs.html#implementation-3
      Client.hasMany(Reservation);
      Reservation.belongsTo(Client);
      ServiceProvider.hasMany(Reservation);
      Reservation.belongsTo(ServiceProvider);
    })
    .then(() => console.log('All models were synchronized successfully.'))
    .catch((err) => console.log('ERROR from synchronizeDBModels(): ', err));
}

// Push example data to db
async function insertExampleData() {
  // https://sequelize.org/master/manual/model-instances.html#a-very-useful-shortcut--the--code-create--code--method
  // Sequelize provides the create method, which combines
  // the build and save methods shown above into a single method.
  const client1 = await Client.create({ name: 'L. Palmer' });
  console.log('Client', client1.name, 'inserted!');

  const client2 = await Client.create({ name: 'D. Cooper' });
  console.log('Client', client2.name, 'inserted!');

  const serviceProvider = await ServiceProvider.create({ name: 'Dr. Jacoby' });
  console.log('Service-Provider', serviceProvider.name, 'inserted!');

  // data for db
  await Reservation.create({
    start: '2020-09-29 19:00',
    end: '2020-09-29 20:00',
    clientid: 1,
    serviceproviderid: 1,
  });

  await Reservation.create({
    start: '2020-09-29 20:01',
    end: '2020-09-29 21:00',
    clientid: 2,
    serviceproviderid: 1,
  });

  await Reservation.create({
    start: '2020-09-30 12:00',
    end: '2020-09-30 13:00',
    clientid: 1,
    serviceproviderid: 1,
  });
}

// Check if the timeframe, client or servicdeprovider are free
async function checkOverlappingReservations(cid, spid, startParam, endParam, rid) {
  const check = await Reservation.findAll({
    where:
      {
        [Op.and]: [
          {
            [Op.or]: [
              { clientid: cid },
              { serviceproviderid: spid },
            ],
          },
          {
            id: { // Leave the original reservation out from the search, 0 to skip
              [Op.ne]: rid,
            },
          },
          {
            [Op.or]: [
              {
                start: {
                  [Op.between]: [startParam, endParam],
                },
              },
              {
                end: {
                  [Op.between]: [startParam, endParam],
                },
              },
              {
                [Op.and]: [
                  {
                    start: {
                      [Op.lte]: startParam,
                    },
                    end: {
                      [Op.gte]: endParam,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
  });
  return check;
}

module.exports.testDBConnection = testDBConnection;
module.exports.synchronizeDBModels = synchronizeDBModels;
module.exports.insertExampleData = insertExampleData;
module.exports.checkOverlappingReservations = checkOverlappingReservations;

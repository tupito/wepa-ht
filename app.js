const { json } = require('express');
const express = require('express');
const { Sequelize, DataTypes, Model } = require('sequelize');

const PORT = process.env.PORT || 8000;

const app = express();

// Database connection
const sequelize = new Sequelize('wepa-ht', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mariadb',
  // https://devstudioonline.com/article/sequelize-set-timezone-and-datetime-format-for-mysql
  timezone: 'Europe/Helsinki', // for writing to database
  dialectOptions: {
    useUTC: false, // for reading from database
    dateStrings: true,
    typeCast: true,
    timezone: 'Europe/Helsinki', // only to disable warning: "please use IANA standard timezone format ('Etc/GMT-3')"
  },
  define: {
    // https://sequelize.org/master/manual/model-basics.html#enforcing-the-table-name-to-be-equal-to-the-model-name
    freezeTableName: true, // Table name = model name
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
// const sequelize = new Sequelize('mariadb://root:root@localhost:3306/wepa-ht');

// Sequelize models
// TAPA 1: sequelize.define
// If you don't define a primaryKey then sequelize uses id by default.
const Client = sequelize.define('client', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const ServiceProvider = sequelize.define('serviceProvider', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

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

/* TAPA 2: Extending Model
// ERROR: Vain yksi class per file!
class Client extends Model {}
Client.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'Client',
});

class ServiceProvider extends Model {}
Client.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'Service-Provider',
});
*/

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

  const res1 = await Reservation.create({
    start: '2020-09-29 19:00',
    end: '2020-09-29 20:00',
    clientid: 1,
    serviceproviderid: 1,
  });

  const res2 = await Reservation.create({
    start: '2020-09-29 20:00',
    end: '2020-09-29 21:00',
    clientid: 2,
    serviceproviderid: 1,
  });

  const res3 = await Reservation.create({
    start: '2020-09-30 12:00',
    end: '2020-09-30 13:00',
    clientid: 1,
    serviceproviderid: 1,
  });
}

// OBS!!!: TODO: Will crash if runned twice in same session
app.get('/initdb', async (req, res, next) => {
  console.log('GET /initdb');
  const jsonResponse = [];
  try {
    await testDBConnection();
    jsonResponse.push({ debugMsg: 'Tested DB' });
    await synchronizeDBModels(); // !!! await: cannot insert data before db tables exists
    jsonResponse.push({ debugMsg: 'Synchronized models' });
    await insertExampleData();
    jsonResponse.push({ debugMsg: 'Inserted example data to DB' });
    res.send(jsonResponse);
  } catch (err) {
    console.log('ERROR from GET /initdb', err);
  }
});

app.get('/reservations', (req, res, next) => {
  console.log('GET /reservations wepa-ht');

  (async () => {
    // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
    // https://sequelize.org/master/manual/eager-loading.html
    const reservations = await Reservation.findAll({
      include: [Client, ServiceProvider],
    });

    const result = JSON.stringify(reservations, null, 2);
    console.log('All reservations:', result);
    res.send(result);
  })();
});

app.listen(PORT);

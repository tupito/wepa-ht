const { json } = require('express');
const express = require('express');
const {
  Sequelize, DataTypes, Model, Op,
} = require('sequelize');
const queryString = require('querystring');

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
  const jsonResponse = [];
  try {
    await testDBConnection();
    jsonResponse.push({ debugMsg: 'OK - Tested DB' });
    await synchronizeDBModels(); // !!! await: cannot insert data before db tables exists
    jsonResponse.push({ debugMsg: 'OK - Synchronized models' });
    await insertExampleData();
    jsonResponse.push({ debugMsg: 'OK - Inserted example data to DB' });
    res.send(jsonResponse);
  } catch (err) {
    console.log('ERROR from GET /initdb', err);
  }
});

app.get('/reservations', async (req, res, next) => {
  console.log('GET /reservations wepa-ht');

  try {
    // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
    // https://sequelize.org/master/manual/eager-loading.html
    const reservations = await Reservation.findAll({
      include: [Client, ServiceProvider],
    });

    console.log('All reservations:', JSON.stringify(reservations, null, 2));
    res.status(200).json(reservations); // Content-Type: application/json;
  } catch (err) {
    console.log('ERROR from GET /reservations', err);
    res.status(400).json({ debugMsg: err });
  }
});

app.use(express.json());

app.post('/reservation', async (req, res, next) => {
  let okToContinue = true;

  // existence check for POST params
  const wantedProps = ['start', 'end', 'clientid', 'serviceproviderid'];
  wantedProps.forEach((prop) => {
    if (!(prop in req.body)) {
      okToContinue = false;
      res.status(400).json({ errorMsg: `${prop} undefined` }); // 400 Bad request, eg. {errorMsg: "time undefined"}
    }
  });

  // time logic check for POST params
  if (okToContinue && req.body.start > req.body.end) {
    okToContinue = false;
    res.status(400).json({ errorMsg: 'start should not be greater then end' }); // 400 Bad request, eg. {errorMsg: "time undefined"}
  }

  if (okToContinue) {
    const check = await Reservation.findAll({
      where:
      {
        [Op.and]: [
          {
            [Op.or]: [
              { clientid: req.body.clientid },
              { serviceproviderid: req.body.serviceproviderid },
            ],
          },
          {
            [Op.or]: [
              {
                start: {
                  [Op.between]: [req.body.start, req.body.end],
                },
              },
              {
                end: {
                  [Op.between]: [req.body.start, req.body.end],
                },
              },
              {
                [Op.and]: [
                  {
                    start: {
                      [Op.lte]: req.body.start,
                    },
                    end: {
                      [Op.gte]: req.body.end,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    // Found any results?
    if (check.length === 0) {
      // Nope, proceed with the insert
      try {
        const insert = await Reservation.create({
          start: req.body.start,
          end: req.body.end,
          clientid: req.body.clientid,
          serviceproviderid: req.body.serviceproviderid,
        });

        res.status(201).json({ debugMsg: 'INSERT success!' }); // 201 created
      } catch (err) {
        console.log('ERROR from POST /reservation', err);
        res.status(400).json({ debugMsg: 'Error from INSERT!' }); // 400 Bad request
      }
    } else {
      // Client or serviceprovider are booked
      res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' }); // 400 Bad request
    }
  }

  // https://sequelize.org/master/manual/model-querying-basics.html#applying-where-clauses
  // Check from the reservations if the client or the serviceprovider are booked
});

app.delete('/reservation/:id', async (req, res, next) => {
  console.log('DELETE /reservation wepa-ht');

  const id_to_delete = req.params.id;

  // https://sequelize.org/master/manual/model-querying-basics.html#simple-delete-queries
  try {
    const del = await Reservation.destroy({
      where: {
        id: id_to_delete,
      },
    });

    if (del > 0) {
      res.status(200).json({ debugMsg: 'OK - Deleted reservation' });
    } else {
      res.status(404).json({ debugMsg: 'NOK - Reservation not found' });
    }
  } catch (err) {
    console.log('ERROR from DELETE /reservation', err);
    res.status(400).json({ debugMsg: err });
  }
});

app.get('/reservations2', async (req, res, next) => {
  console.log('GET /reservations2?search_criteria wepa-ht');

  // Use period of time as a query string
  const { start } = req.query;
  const { end } = req.query;

  try {
    // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
    // https://sequelize.org/master/manual/eager-loading.html
    const reservations = await Reservation.findAll({
      include: [Client, ServiceProvider],
      where:
      {
        [Op.and]: [
          {
            start: {
              [Op.gte]: start,
            },
            end: {
              [Op.lte]: end,
            },
          },
        ],
      },
    });

    console.log('Reservations:', JSON.stringify(reservations, null, 2));
    res.status(200).json(reservations); // Content-Type: application/json;
  } catch (err) {
    console.log('ERROR from GET /reservations2?search_criteria', err);
    // res.json({ debugMsg: 'Error from GET /reservations2?search_criteria!' });
    res.status(400).json({ debugMsg: err });
  }
});

app.get('/reservations3', async (req, res, next) => {
  console.log('GET /reservations3?search_criteria wepa-ht');

  // Serviceproviderid
  const { sp } = req.query;

  try {
    // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
    // https://sequelize.org/master/manual/eager-loading.html
    const reservations = await Reservation.findAll({
      include: [Client, ServiceProvider],
      where:
      {
        serviceproviderid: sp,
      },
    });

    console.log('Reservations:', JSON.stringify(reservations, null, 2));
    res.status(200).json(reservations); // Content-Type: application/json;
  } catch (err) {
    console.log('ERROR from GET /reservations3?search_criteria', err);
    // res.json({ debugMsg: 'Error from GET /reservations3?search_criteria!' });
    res.status(400).json({ debugMsg: err });
  }
});

app.put('/reservation/:id', async (req, res, next) => {
  console.log('PUT /reservation wepa-ht');

  const id_to_update = req.params.id;

  // Check from the reservations if the client or the serviceprovider are booked
  const check = await Reservation.findAll({
    where:
    {
      [Op.and]: [
        {
          [Op.or]: [
            { clientid: req.body.clientid },
            { serviceproviderid: req.body.serviceproviderid },
          ],
        },
        {
          [Op.or]: [
            {
              start: {
                [Op.between]: [req.body.start, req.body.end],
              },
            },
            {
              end: {
                [Op.between]: [req.body.start, req.body.end],
              },
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: req.body.start,
                  },
                  end: {
                    [Op.gte]: req.body.end,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  // Found any results?
  if (check.length === 0) {
    // Nope, proceed with the update
    // https://sequelize.org/master/manual/model-querying-basics.html#simple-update-queries
    try {
      const update = await Reservation.update({
        start: req.body.start,
        end: req.body.end,
        clientid: req.body.clientid,
        serviceproviderid: req.body.serviceproviderid,
      }, {
        where: {
          id: id_to_update,
        },
      });

      res.json({ debugMsg: 'PUT success!' });
    } catch (err) {
      console.log('ERROR from PUT /reservation', err);
      res.json({ debugMsg: 'Error from PUT!' });
    }
  } else {
    // Client or serviceprovider are booked
    res.json({ debugMsg: 'Client or serviceprovider are booked!' });
  }
});

app.patch('/reservation/:id', async (req, res, next) => {
  console.log('PATCH /reservation wepa-ht');

  const id_to_update = req.params.id;

  // RAW update without any checks or validations.
  // TODO: Check JSON, what values are to be updated and validate them.

  /*
  // Check from the reservations if the client or the serviceprovider are booked
  const check = await Reservation.findAll({
    where:
    {
      [Op.and]: [
        {
          [Op.or]: [
            { clientid: req.body.clientid },
            { serviceproviderid: req.body.serviceproviderid },
          ],
        },
        {
          [Op.or]: [
            {
              start: {
                [Op.between]: [req.body.start, req.body.end],
              },
            },
            {
              end: {
                [Op.between]: [req.body.start, req.body.end],
              },
            },
            {
              [Op.and]: [
                {
                  start: {
                    [Op.lte]: req.body.start,
                  },
                  end: {
                    [Op.gte]: req.body.end,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });
  */

  // Found any results?
  // if (check.length === 0) {
  // Nope, proceed with the update
  // https://sequelize.org/master/manual/model-querying-basics.html#simple-update-queries
  try {
    const update = await Reservation.update({
      start: req.body.start,
      end: req.body.end,
      clientid: req.body.clientid,
      serviceproviderid: req.body.serviceproviderid,
    }, {
      where: {
        id: id_to_update,
      },
    });

    res.json({ debugMsg: 'PATCH success!' });
  } catch (err) {
    console.log('ERROR from PATCH /reservation', err);
    res.json({ debugMsg: 'Error from PATCH!' });
  }
  /* } else {
    // Client or serviceprovider are booked
    res.json({ debugMsg: 'Client or serviceprovider are booked!' });
  } */
});

app.listen(PORT);
module.exports = app; // for mocha

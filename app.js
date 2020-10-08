const express = require('express');
const { Op } = require('sequelize');

// Controllers
const controllers = require('./controllers/controllers');

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());

// Database connection
const sequelize = require('./models/sequelize');

// Sequelize models
const Client = require('./models/client');
const ServiceProvider = require('./models/serviceprovider');
const Reservation = require('./models/reservation');

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
    start: '2020-09-29 20:01',
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

app.get('/reservations', controllers.getReservations);

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

  const idToDelete = req.params.id;

  // parameter type check
  if (!Number.isNaN(parseInt(idToDelete, 10))) {
  // https://sequelize.org/master/manual/model-querying-basics.html#simple-delete-queries

    try {
      const del = await Reservation.destroy({
        where: {
          id: idToDelete,
        },
      });

      if (del > 0) {
        res.json({ debugMsg: 'DELETE success!' });
      } else {
        res.status(404).json({ errorMsg: 'Nothing to DELETE!' }); // 404 Not Found
      }
    } catch (err) {
      console.log('ERROR from DELETE /reservation', err);
      res.json({ debugMsg: 'Error from DELETE!' });
    }
  } else {
    res.status(400).json({ errorMsg: `type of ${idToDelete} is not number` });
  }
});

app.put('/reservation/:id', async (req, res, next) => {
  const idToUpdate = req.params.id;
  let okToContinue = true;

  // existence check for PUT params
  const wantedProps = ['start', 'end', 'clientid', 'serviceproviderid'];
  wantedProps.forEach((prop) => {
    if (!(prop in req.body)) {
      okToContinue = false;
      res.status(400).json({ errorMsg: `${prop} undefined` }); // 400 Bad request, eg. {errorMsg: "time undefined"}
    }
  });

  // time logic check for PUT params
  if (okToContinue && req.body.start > req.body.end) {
    okToContinue = false;
    res.status(400).json({ errorMsg: 'start should not be greater then end' }); // 400 Bad request, eg. {errorMsg: "time undefined"}
  }

  if (okToContinue) {
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
            id: idToUpdate,
          },
        });

        // If found the reservation and update went succesfully
        if (update > 0) {
          res.status(201).json({ debugMsg: 'PUT success!' }); // 201 created
        } else {
          res.status(404).json({ debugMsg: 'NOK - Reservation not found' }); // 404 not found
        }
      } catch (err) {
        console.log('ERROR from PUT /reservation', err);
        res.status(400).json({ debugMsg: 'Error from PUT!' }); // 400 Bad request
      }
    } else {
      // Client or serviceprovider are booked
      res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' });
    }
  }
});

app.patch('/reservation/:id', async (req, res, next) => {
  const idToUpdate = req.params.id;

  // Find the reservation
  const reservation = await Reservation.findByPk(idToUpdate);
  if (reservation === null) {
    res.status(404).json({ debugMsg: 'NOK - Reservation not found' }); // 404 not found
  } else {
    // Found the reservation
    // Check the params
    if (req.body.start !== undefined) reservation.start = req.body.start;
    if (req.body.end !== undefined) reservation.end = req.body.end;
    if (req.body.clientid !== undefined) reservation.clientid = req.body.clientid;
    if (req.body.serviceproviderid !== undefined) {
      reservation.serviceproviderid = req.body.serviceproviderid;
    }

    // Check from the reservations if the client or the serviceprovider are booked
    const check = await Reservation.findAll({
      where:
      {
        [Op.and]: [
          {
            [Op.or]: [
              { clientid: reservation.clientid },
              { serviceproviderid: reservation.serviceproviderid },
            ],
          },
          {
            id: { // Leave the original reservation out from the search
              [Op.ne]: idToUpdate,
            },
          },
          {
            [Op.or]: [
              {
                start: {
                  [Op.between]: [reservation.start, reservation.end],
                },
              },
              {
                end: {
                  [Op.between]: [reservation.start, reservation.end],
                },
              },
              {
                [Op.and]: [
                  {
                    start: {
                      [Op.lte]: reservation.start,
                    },
                    end: {
                      [Op.gte]: reservation.end,
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
          start: reservation.start,
          end: reservation.end,
          clientid: reservation.clientid,
          serviceproviderid: reservation.serviceproviderid,
        }, {
          where: {
            id: idToUpdate,
          },
        });

        // If found the reservation and update went succesfully
        if (update > 0) {
          res.status(201).json({ debugMsg: 'PATCH success!' }); // 201 created
        } else {
          res.status(404).json({ debugMsg: 'NOK - Reservation not found' }); // 404 not found
        }
      } catch (err) {
        console.log('ERROR from PATCH /reservation', err);
        res.status(400).json({ debugMsg: 'Error from PATCH!' }); // 400 Bad request
      }
    } else {
      // Client or serviceprovider are booked
      res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' });
    }
  }
});

app.listen(PORT);
module.exports = app; // for mocha

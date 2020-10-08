const { Op } = require('sequelize');

// Database connection
const sequelize = require('../models/sequelize');

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
const getInitDB = async (req, res, next) => {
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
};

const getReservations = async (req, res, next) => {
  // GET ALL
  if (Object.keys(req.query).length === 0) {
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
  }
  // SEARCH QUERY
  else {
    let okToContinue = true;

    const whereQueryObject = { [Op.and]: [{}] }; // for SELECT WHERE xxx AND xxx conditions
    const acceptedSearchParams = ['start', 'end', 'spid', 'cid'];

    // any reservation table column can be used as a search param
    const {
      start, end, spid, cid,
    } = req.query;

    Object.keys(req.query).forEach((queryParam) => {
      if (!acceptedSearchParams.includes(queryParam)) {
        res.status(400).json({ errorMsg: 'Unaccepted parameter used' });
        okToContinue = false;
      }
    });

    if (okToContinue) {
      // if searching with time, both "start" and "end" are needed
      if ((start && end === undefined) || (start === undefined && end)) {
        res.status(400).json({ errorMsg: 'Time query needs both start and end values' });
        okToContinue = false;
      } else {
        // https://stackoverflow.com/questions/56169254/how-to-create-dynamic-where-clause-in-sequelize-query-using-or-and-and
        // https://medium.com/@tinderholmgene/querying-in-sequelize-47393badec01
        // start and end (time) in query string => add to WHERE
        whereQueryObject[Op.and][0].start = { [Op.gte]: start };
        whereQueryObject[Op.and][0].end = { [Op.lte]: end };
      }

      // serviceproviderid in query string => add to WHERE
      if (spid !== undefined) {
        whereQueryObject[Op.and][0] = { serviceproviderid: spid };
      }

      // customerid in query string => add to WHERE
      if (cid !== undefined) {
        whereQueryObject[Op.and][0] = { clientid: cid };
      }
    }

    if (okToContinue) {
      try {
        // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
        // https://sequelize.org/master/manual/eager-loading.html
        const reservations = await Reservation.findAll({
          include: [Client, ServiceProvider],
          where: whereQueryObject,
        });

        console.log('Reservations:', JSON.stringify(reservations, null, 2));
        res.status(200).json(reservations); // Content-Type: application/json;
      } catch (err) {
        console.log('ERROR from GET /reservations2?search_criteria', err);
        // res.json({ debugMsg: 'Error from GET /reservations2?search_criteria!' });
        res.status(400).json({ debugMsg: err });
      }
    }
  }
};

const postReservation = async (req, res, next) => {
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
};

const deleteReservation = async (req, res, next) => {
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
};

const putReservation = async (req, res, next) => {
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
};

const patchReservation = async (req, res, next) => {
  let okToContinue = true;

  const acceptedProps = ['start', 'end', 'clientid', 'serviceproviderid'];

  // parameter name check
  Object.keys(req.body).forEach((queryParam) => {
    if (!acceptedProps.includes(queryParam)) {
      res.status(400).json({ errorMsg: 'Unaccepted parameter used' });
      okToContinue = false;
    }
  });

  const idToUpdate = req.params.id;

  if (okToContinue) {
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

      /*
      time logic check new values, Date.parse is a must have !!!
      - reservation.start                         // "2021-10-03 11:00:00" string
      - reservation.start = req.body.start        // Date()
      */
      if (Date.parse(reservation.start) > Date.parse(reservation.end)) {
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
    }
  }
};

module.exports.getInitDB = getInitDB;
module.exports.getReservations = getReservations;
module.exports.postReservation = postReservation;
module.exports.deleteReservation = deleteReservation;
module.exports.putReservation = putReservation;
module.exports.patchReservation = patchReservation;

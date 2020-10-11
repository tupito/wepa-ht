const { Op } = require('sequelize');

const jwt = require('jsonwebtoken'); // jwt authorization
// Sequelize models
const Client = require('../models/client');
const ServiceProvider = require('../models/serviceprovider');
const Reservation = require('../models/reservation');
const User = require('../models/user');

// Database functions
const dbHelper = require('./db-helpers');

// Validation functions
const validationHelper = require('./validation-helpers');

// custom config, show/hide console.logs
const { showConsoleLog } = require('../config/custom');

// jwt

// OBS!!!: TODO: Will crash if runned twice in same session
const getInitDB = async (req, res) => {
  const jsonResponse = [];
  try {
    await dbHelper.testDBConnection();
    jsonResponse.push({ debugMsg: 'OK - Tested DB' });
    await dbHelper.synchronizeDBModels(); // !!! await: cannot insert data before db tables exists
    jsonResponse.push({ debugMsg: 'OK - Synchronized models' });
    await dbHelper.insertExampleData();
    jsonResponse.push({ debugMsg: 'OK - Inserted example data to DB' });
    res.send(jsonResponse);
  } catch (err) {
    if (showConsoleLog) console.log('ERROR from GET /initdb', err);
    res.status(400).json({ errorMsg: err });
  }
};

const getReservations = async (req, res) => {
  if (Object.keys(req.query).length === 0) {
    // GET ALL
    try {
      // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
      // https://sequelize.org/master/manual/eager-loading.html
      const reservations = await Reservation.findAll({
        include: [Client, ServiceProvider],
      });

      if (showConsoleLog) console.log('All reservations:', JSON.stringify(reservations, null, 2));
      res.status(200).json(reservations); // Content-Type: application/json;
    } catch (err) {
      if (showConsoleLog) console.log('ERROR from GET /reservations', err);
      res.status(400).json({ errorMsg: err });
    }
  } else {
    // SEARCH QUERY
    const whereQueryObject = { [Op.and]: [{}] }; // for SELECT WHERE xxx AND xxx conditions

    // any reservation table column (db) can be used as a search param
    const {
      start, end, spid, cid,
    } = req.query;

    // verify param names, if not valid -> return error message
    let okToContinue = !!validationHelper.hasValidKeys(req.query, ['start', 'end', 'spid', 'cid']);

    if (!okToContinue) {
      res.status(400).json({ errorMsg: 'Unaccepted parameter used' });
    }

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
      if (spid !== undefined) whereQueryObject[Op.and][0] = { serviceproviderid: spid };
      // customerid in query string => add to WHERE
      if (cid !== undefined) whereQueryObject[Op.and][0] = { clientid: cid };
    }

    if (okToContinue) {
      try {
        // https://sequelize.org/master/manual/model-querying-basics.html#simple-select-queries
        // https://sequelize.org/master/manual/eager-loading.html
        const reservations = await Reservation.findAll({
          include: [Client, ServiceProvider],
          where: whereQueryObject,
        });

        if (showConsoleLog) console.log('Reservations:', JSON.stringify(reservations, null, 2));
        res.status(200).json(reservations); // Content-Type: application/json;
      } catch (err) {
        if (showConsoleLog) console.log('ERROR from GET /reservations', err);
        res.status(400).json({ errorMsg: err });
      }
    }
  }
};

const postReservation = async (req, res) => {
  // existence check for POST params
  const undefinedKey = validationHelper.getUndefinedKey(req.body, ['start', 'end', 'clientid', 'serviceproviderid']);

  let okToContinue = undefinedKey === ''; // true if no undefinedKey

  if (undefinedKey) {
    res.status(400).json({ errorMsg: `${undefinedKey} undefined` }); // 400 Bad request, eg. {errorMsg: "time undefined"}
    okToContinue = false;
  }

  // time logic check for POST params
  if (okToContinue && req.body.start > req.body.end) {
    okToContinue = false;
    res.status(400).json({ errorMsg: 'start should not be greater then end' }); // 400 Bad request, eg. {errorMsg: "time undefined"}
  }

  if (okToContinue) {
    // Check from the reservations if the client or the serviceprovider are booked.
    // Param 0 means no reservations are skipped during the check.
    const check = await dbHelper.checkOverlappingReservations(req.body, 0);

    // Found any results?
    if (check.length === 0) {
      // Nope, proceed with the insert
      try {
        await Reservation.create({
          start: req.body.start,
          end: req.body.end,
          clientid: req.body.clientid,
          serviceproviderid: req.body.serviceproviderid,
        });

        res.status(201).json({ debugMsg: 'INSERT success!' }); // 201 created
      } catch (err) {
        if (showConsoleLog) console.log('ERROR from POST /reservation', err);
        res.status(400).json({ debugMsg: 'Error from INSERT!' }); // 400 Bad request
      }
    } else {
      // Client or serviceprovider are booked
      res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' }); // 400 Bad request
    }
  }
};

const deleteReservation = async (req, res) => {
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
        res.status(200).json({ debugMsg: 'DELETE success!' });
      } else {
        res.status(404).json({ errorMsg: 'Nothing to DELETE!' }); // 404 Not Found
      }
    } catch (err) {
      if (showConsoleLog) console.log('ERROR from DELETE /reservation', err);
      res.status(400).json({ errorMsg: 'Error from DELETE!' });
    }
  } else {
    res.status(400).json({ errorMsg: `type of ${idToDelete} is not number` });
  }
};

const putReservation = async (req, res) => {
  const idToUpdate = req.params.id;

  // existence check for PUT params
  const undefinedKey = validationHelper.getUndefinedKey(req.body, ['start', 'end', 'clientid', 'serviceproviderid']);

  let okToContinue = undefinedKey === ''; // true if no undefinedKey

  if (undefinedKey) {
    res.status(400).json({ errorMsg: `${undefinedKey} undefined` }); // 400 Bad request, eg. {errorMsg: "time undefined"}
    okToContinue = false;
  }

  // time logic check for PUT params
  if (okToContinue && req.body.start > req.body.end) {
    okToContinue = false;
    res.status(400).json({ errorMsg: 'start should not be greater then end' }); // 400 Bad request, eg. {errorMsg: "time undefined"}
  }

  if (okToContinue) {
    // Check from the reservations if the client or the serviceprovider are booked.
    // Param 0 means no reservations are skipped during the check.
    const check = await dbHelper.checkOverlappingReservations(req.body, 0);

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
        if (showConsoleLog) console.log('ERROR from PUT /reservation', err);
        res.status(400).json({ debugMsg: 'Error from PUT!' }); // 400 Bad request
      }
    } else {
      // Client or serviceprovider are booked
      res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' });
    }
  }
};

const patchReservation = async (req, res) => {
  const idToUpdate = req.params.id;

  // verify param names, if not valid -> return error message
  let okToContinue = validationHelper.hasValidKeys(req.body, ['start', 'end', 'clientid', 'serviceproviderid']) ? true : res.status(400).json({ errorMsg: 'Unaccepted parameter used' });

  if (okToContinue) {
    // Find the reservation
    const reservation = await Reservation.findByPk(idToUpdate);
    if (reservation === null) {
      res.status(404).json({ debugMsg: 'NOK - Reservation not found' }); // 404 not found
    } else {
      // Found the reservation, check the params
      if (req.body.start !== undefined) reservation.start = req.body.start;
      if (req.body.end !== undefined) reservation.end = req.body.end;
      if (req.body.clientid !== undefined) reservation.clientid = req.body.clientid;
      if (req.body.serviceproviderid !== undefined) {
        reservation.serviceproviderid = req.body.serviceproviderid;
      }
      /*
      time logic check new values, Date.parse() is a must have !!!
      - reservation.start                         // "2021-10-03 11:00:00" string
      - reservation.start = req.body.start        // Date()
      */
      if (Date.parse(reservation.start) > Date.parse(reservation.end)) {
        okToContinue = false;
        res.status(400).json({ errorMsg: 'start should not be greater then end' }); // 400 Bad request, eg. {errorMsg: "time undefined"}
      }

      if (okToContinue) {
        // Check from the reservations if the client or the serviceprovider are booked.
        // Second parameter is the id of the reservation we want to skip.
        const check = await dbHelper.checkOverlappingReservations(reservation, idToUpdate);

        try {
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
              if (showConsoleLog) console.log('ERROR from PATCH /reservation', err);
              res.status(400).json({ debugMsg: 'Error from PATCH!' }); // 400 Bad request
            }
          } else {
            // Client or serviceprovider are booked
            res.status(400).json({ errorMsg: 'Client or serviceprovider are booked!' });
          }
        } catch (err) {
          if (showConsoleLog) console.log(err);
        }
      }
    }
  }
};

// jwt: https://harshitpant.com/blog/using-json-web-token-for-authentication
const login = async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({
    where: {
      username, password,
    },
  });

  if (foundUser !== null) {
    // If all credentials are correct do this
    const token = jwt.sign(
      { id: foundUser.id, username: foundUser.username },
      'never use this simple secret in real life',
      { expiresIn: 129600 },
    ); // Sigining the token
    res.json({
      success: true,
      err: null,
      token,
    });
  } else {
    return res.status(401).json({
      success: false,
      token: null,
      err: 'Username or password is incorrect',
    });
  }
};

module.exports.getInitDB = getInitDB;
module.exports.getReservations = getReservations;
module.exports.postReservation = postReservation;
module.exports.deleteReservation = deleteReservation;
module.exports.putReservation = putReservation;
module.exports.patchReservation = patchReservation;
module.exports.login = login;

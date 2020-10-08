const { Op } = require('sequelize');

// Database connection
const sequelize = require('../models/sequelize');

// Sequelize models
const Client = require('../models/client');
const ServiceProvider = require('../models/serviceprovider');
const Reservation = require('../models/reservation');

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

module.exports.getReservations = getReservations;
module.exports.postReservation = postReservation;

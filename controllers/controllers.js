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

module.exports.getReservations = getReservations;

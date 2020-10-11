const { Sequelize } = require('sequelize');

// custom config, show/hide console.logs
const { showSequelizeLog } = require('./custom');

// Database connection
const sequelize = new Sequelize('wepa-ht', 'root', 'root', {
  host: 'localhost',
  port: 3306,
  dialect: 'mariadb',
  logging: showSequelizeLog,
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

module.exports = sequelize;

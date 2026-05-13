const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: 'mysql',
    host: process.env.HOST,
    dialectOptions: {
      multipleStatements: true,
    },
    timezone: '+03:00',
    logging: false,
  },
);

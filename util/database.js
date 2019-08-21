const Sequelize = require('sequelize');

const sequelize = new Sequelize('teez','','', {
  dialect: 'postgres',
  host: 'localhost',
  database: 'teez'
});

module.exports = sequelize;

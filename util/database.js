const Sequelize = require('sequelize');

const sequelize = new Sequelize('teez&feelz','','', {
  dialect: 'postgres',
  host: 'localhost'
});

module.exports = sequelize;

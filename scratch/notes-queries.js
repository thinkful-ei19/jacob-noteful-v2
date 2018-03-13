'use strict';
const knex = require('../knex');

knex.select(1).then(res => console.log(res));
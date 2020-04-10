const initOptions = {
     capSQL: true
};

const pgp = require('pg-promise')(initOptions);
const db = pgp('postgres://username:password@localhost:5432/database_name');

module.exports = {
    pgp, db
};

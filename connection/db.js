const { Pool } = require('pg');

// const dbPool = new Pool({
//   database: 'personal_web_b36',
//   port: 5432,
//   user: 'postgres',
//   password: 'admin',
// });

module.exports = dbPool;

const isLive = process.env.NODE_ENV === "live"
let dbPool

if(isLive) {
  dbPool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
} else {
  dbPool = new Pool({
    database: 'personal_web_b36',
    port: 5432,
    user: 'postgres',
    password: 'admin',
  });

}
module.exports = dbPool;
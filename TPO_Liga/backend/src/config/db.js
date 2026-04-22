const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'YouthBasketballLeague'};Trusted_Connection=yes;`
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server successfully using Windows Authentication!');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Please check your credentials.', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};

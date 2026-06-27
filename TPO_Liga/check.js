
const { sql, poolPromise } = require('./backend/src/config/db');
async function check() {
  const pool = await poolPromise;
  const res = await pool.request().query(\SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Matches'\);
  console.log(res.recordset);
  process.exit(0);
}
check();


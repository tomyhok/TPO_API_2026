const { sql, poolPromise } = require('../config/db');

class UserModel {
  // Encuentra un administrador por su nombre de usuario
  static async findByUsername(username) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Username', sql.NVarChar, username)
      .query('SELECT * FROM Administrators WHERE Username = @Username');
    
    return result.recordset[0];
  }
}

module.exports = UserModel;

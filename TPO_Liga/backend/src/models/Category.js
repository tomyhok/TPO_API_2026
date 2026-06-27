const { sql, poolPromise } = require('../config/db');

class CategoryModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Categories ORDER BY CategoryID');
    return result.recordset;
  }

  static async create(name) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, name)
      .query('INSERT INTO Categories (Name) OUTPUT INSERTED.* VALUES (@Name)');
    return result.recordset[0];
  }

  static async update(id, name) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('CategoryID', sql.Int, id)
      .input('Name', sql.NVarChar, name)
      .query('UPDATE Categories SET Name = @Name OUTPUT INSERTED.* WHERE CategoryID = @CategoryID');
    return result.recordset.length > 0 ? result.recordset[0] : null;
  }

  static async delete(id) {
    const pool = await poolPromise;
    // Simplification: Not deleting matches/players cascade here, assuming they are reassigned or handled
    const request = pool.request().input('CategoryID', sql.Int, id);
    const result = await request.query('DELETE FROM Categories WHERE CategoryID = @CategoryID');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = CategoryModel;

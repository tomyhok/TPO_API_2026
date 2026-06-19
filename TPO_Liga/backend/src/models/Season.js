const { sql, poolPromise } = require('../config/db');

class SeasonModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Seasons ORDER BY IsActive DESC, StartDate DESC');
    return result.recordset;
  }

  static async getActive() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT TOP 1 * FROM Seasons WHERE IsActive = 1');
    return result.recordset[0];
  }

  static async create(Name, StartDate, EndDate, IsActive) {
    const pool = await poolPromise;
    
    // Si la nueva es activa, desactivamos el resto
    if (IsActive) {
      await pool.request().query('UPDATE Seasons SET IsActive = 0');
    }

    const result = await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('StartDate', sql.Date, StartDate || null)
      .input('EndDate', sql.Date, EndDate || null)
      .input('IsActive', sql.Bit, IsActive ? 1 : 0)
      .query('INSERT INTO Seasons (Name, StartDate, EndDate, IsActive) OUTPUT INSERTED.* VALUES (@Name, @StartDate, @EndDate, @IsActive)');
    
    return result.recordset[0];
  }

  static async update(id, Name, StartDate, EndDate, IsActive) {
    const pool = await poolPromise;

    if (IsActive) {
      await pool.request().query('UPDATE Seasons SET IsActive = 0');
    }

    const request = pool.request().input('SeasonID', sql.Int, id);
    let updates = [];

    if (Name !== undefined) {
      request.input('Name', sql.NVarChar, Name);
      updates.push('Name = @Name');
    }
    if (StartDate !== undefined) {
      request.input('StartDate', sql.Date, StartDate || null);
      updates.push('StartDate = @StartDate');
    }
    if (EndDate !== undefined) {
      request.input('EndDate', sql.Date, EndDate || null);
      updates.push('EndDate = @EndDate');
    }
    if (IsActive !== undefined) {
      request.input('IsActive', sql.Bit, IsActive ? 1 : 0);
      updates.push('IsActive = @IsActive');
    }

    if (updates.length === 0) return null;

    const query = `UPDATE Seasons SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE SeasonID = @SeasonID`;
    const result = await request.query(query);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  }
}

module.exports = SeasonModel;

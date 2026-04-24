require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/db');

async function seedAdmin() {
  try {
    const password = 'TPO_Admin_2026';
    const username = 'admin';

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Connect to DB and insert
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Username', sql.NVarChar, username)
      .input('PasswordHash', sql.NVarChar, passwordHash)
      .query('INSERT INTO Administrators (Username, PasswordHash) VALUES (@Username, @PasswordHash)');

    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();

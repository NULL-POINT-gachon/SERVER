const db = require('../config/database');

exports.getAllTransportations = async () => {
  const [rows] = await db.query('SELECT * FROM Transportation');
  return rows;
};
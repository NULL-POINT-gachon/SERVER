const db = require('../config/database');

const findUserByEmail = async (email) => {
  const query = `SELECT * FROM User WHERE email = ?`;
  
  try {
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('이메일로 사용자 검색 중 오류:', error);
    throw error;
  }
};

const findUserById = async (id) => {
  const query = `SELECT * FROM User WHERE id = ?`;
  
  try {
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('ID로 사용자 검색 중 오류:', error);
    throw error;
  }
};

const createUser = async (userData) => {
  const { name, email, password, age, gender, residence } = userData;
  
  const query = `
    INSERT INTO User (name, email, password, age, gender, residence, created_at, updated_at, status) 
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
  `;
  
  try {
    const [result] = await db.execute(query, [
      name, email, password, age, gender, residence
    ]);
    return result.insertId;
  } catch (error) {
    console.error('사용자 생성 중 오류:', error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
const db = require('../config/database');

const getLatestUsers = async () => {
  const query = `SELECT * FROM User ORDER BY created_at DESC LIMIT 3`;
  try {
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error('최근 사용자 조회 중 오류:', error);
    throw error;
  }
};
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
const updateUser = async (userId, userData) => {
  const updateFields = [];
  const values = [];
  
  Object.entries(userData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updateFields.length === 0) return;
  
  const query = `
    UPDATE User 
    SET ${updateFields.join(', ')}, updated_at = NOW() 
    WHERE id = ?
  `;
  
  values.push(userId);
  
  try {
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

const findAdmins = async () => {
  const query = `SELECT * FROM User WHERE role = 'admin'`;
  
  try {
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error('관리자 검색 중 오류:', error);
    throw error;
  }
};

const updateUserRole = async (userId, role) => {
  const query = `UPDATE User SET role = ?, updated_at = NOW() WHERE id = ?`;
  
  try {
    const [result] = await db.execute(query, [role, userId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('사용자 역할 변경 중 오류:', error);
    throw error;
  }
};

const countUsers = async () => {
  const query = `SELECT COUNT(*) AS userCnt FROM User`;
  try {
    const [rows] = await db.execute(query);
    console.log("> rows", rows);
    console.log("> rows[0].count", rows[0].userCnt);
    return rows[0].userCnt;
  } catch (error) {
    console.error('사용자 수 조회 중 오류:', error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser , 
  updateUser ,
  findAdmins ,
  updateUserRole,
  countUsers,
  getLatestUsers
};
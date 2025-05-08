const db = require('../config/database');

const mockUsers = [
  {
    id: 1,
    name: "김철수",
    email: "chulsoo@example.com",
    age: 29,
    gender: "남성",
    status: 1,
  },
  {
    id: 2,
    name: "이영희",
    email: "younghee@example.com",
    age: 25,
    gender: "여성",
    status: 0,
  },
];

exports.findAllUsers = async () => {
  const [rows] = await db.query(`
    SELECT id, name, email, age, gender, residence, status, role
    FROM User
  `);
  return rows;
};

exports.findUserById = async (userId) => {
  const [rows] = await db.query(`
    SELECT id, name, email, age, gender, residence, status, role
    FROM User
    WHERE id = ?
  `, [userId]);
  return rows[0];
};

exports.updateUserStatus = async (userId, status) => {
  const [result] = await db.query(`
    UPDATE User 
    SET status = ?
    WHERE id = ?
  `, [status, userId]);
  return result.affectedRows === 1;
};
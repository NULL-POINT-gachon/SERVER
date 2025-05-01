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

// 💡 실제 DB 조회
exports.findAllUsers = async () => {
  // [Mock 테스트용]
//   console.log('[Mock] 전체 사용자 조회');
//   return mockUsers;

  // [실제 DB 연동용]
  const [rows] = await db.query(`
    SELECT 식별자 AS id, 이름 AS name, 이메일 AS email, 나이 AS age, 성별 AS gender, 상태 AS status 
    FROM 사용자
  `);
  return rows;
};

exports.findUserById = async (userId) => {
  // [Mock 테스트용]
//   console.log('[Mock] 사용자 상세 조회:', userId);
//   return mockUsers.find(user => user.id === Number(userId));

  // [실제 DB 연동용]
  const [rows] = await db.query(`
    SELECT 식별자 AS id, 이름 AS name, 이메일 AS email, 나이 AS age, 성별 AS gender, 상태 AS status 
    FROM 사용자
    WHERE 식별자 = ?
  `, [userId]);
  return rows[0];
};

exports.updateUserStatus = async (userId, status) => {
  // [Mock 테스트용]
//   console.log('[Mock] 사용자 상태 변경:', userId, status);
//   const user = mockUsers.find(u => u.id === Number(userId));
//   if (user) {
//     user.status = status;
//     return true;
//   }
//   return false;

  // [실제 DB 연동용]
  const [result] = await db.query(`
    UPDATE 사용자 
    SET 상태 = ?
    WHERE 식별자 = ?
  `, [status, userId]);
  return result.affectedRows === 1;
};
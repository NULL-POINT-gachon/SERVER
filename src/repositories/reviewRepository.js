const db = require('../config/database');

exports.insertReview = async (userId, destinationId, rating, content) => {
//   const [result] = await db.query(`
//     INSERT INTO 리뷰 (사용자식별자, 여행지식별자, 평점, 리뷰내용, 작성일자, 수정일자, 상태)
//     VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
//   `, [userId, destinationId, rating, content]);

//   return { reviewId: result.insertId };

console.log('[Mock] 리뷰 작성:', {
    userId,
    destinationId,
    rating,
    content,
  });

  // 실제 insert 대신 가짜 ID 반환
  return { reviewId: Math.floor(Math.random() * 1000) };
};
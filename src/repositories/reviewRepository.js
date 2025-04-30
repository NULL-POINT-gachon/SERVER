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
exports.findByDestinationId = async (destinationId) => {
  // 실제 DB 쿼리 (추후 사용 시 주석 해제)
  /*
  const [rows] = await db.query(`
    SELECT * FROM 리뷰 
    WHERE 여행지식별자 = ? AND 상태 = 1 
    ORDER BY 작성일자 DESC
  `, [destinationId]);
  return rows;
  */

  // ✅ 모킹 데이터 (테스트용)
  console.log('[Mock] 리뷰 조회 - 여행지 ID:', destinationId);
  return [
    {
      id: 101,
      userId: 1,
      destinationId,
      rating: 5,
      content: '정말 멋진 장소였어요!',
      createdAt: new Date(),
    },
    {
      id: 102,
      userId: 2,
      destinationId,
      rating: 4,
      content: '다음에 또 가고 싶어요.',
      createdAt: new Date(),
    }
  ];
};
exports.getAllReviews = async () => {
  // 🔁 실제 DB 연동 코드 (주석처리)
  // const [rows] = await db.query(`SELECT * FROM 리뷰 WHERE 상태 = 1`);
  // return rows;

  // 🔧 Mock 데이터로 대체
  return [
    {
      reviewId: 1,
      userId: 10,
      destinationId: 5,
      rating: 4,
      content: "정말 멋진 장소였습니다!",
      createdAt: "2025-04-30",
    },
    {
      reviewId: 2,
      userId: 12,
      destinationId: 3,
      rating: 5,
      content: "완벽한 하루였어요",
      createdAt: "2025-04-29",
    },
  ];
};
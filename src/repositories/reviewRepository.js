const db = require('../config/database');

exports.getLatestReviews = async () => {
  const query = `SELECT * FROM Review ORDER BY created_at DESC LIMIT 5`;
  try {
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error('최근 리뷰 조회 중 오류:', error);
    throw error;
  }
};

exports.insertReview = async (userId, destinationId, rating, content) => {
  console.log("insertReview ▶", { userId, destinationId, rating, content });
  const [result] = await db.query(`
    INSERT INTO Review (user_id, destination_id, rating, review_content, created_at, updated_at, status)
    VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
  `, [userId, destinationId, rating, content]);

  return { reviewId: result.insertId };
};

exports.countReviews = async () => {
  const query = `SELECT COUNT(*) AS reviewCnt FROM Review`;
  try {
    const [rows] = await db.execute(query);
    return rows[0].reviewCnt;
  } catch (error) {
    console.error('리뷰 수 조회 중 오류:', error);
    throw error;
  }
};

exports.findReviewsByUserId = async (userId) => {
  const [rows] = await db.query(`
    SELECT * FROM Review
    WHERE user_id = ? AND status = 1
  `, [userId]);
  return rows;
};

// reviewRepository.js
exports.upsertReview = async ({ userId, destinationId, rating, content }) => {
  console.log("destinationId", destinationId);
  /* 새로 쓰거나, 이미 있으면 UPDATE */
  const [result] = await db.execute(
    `INSERT INTO Review
       (user_id, destination_id, rating, review_content, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       rating         = VALUES(rating),
       review_content = VALUES(review_content),
       updated_at     = NOW()`,
    [userId, destinationId, rating, content]
  );

  /* MySQL8: insertId가 0이면 업데이트, 아니면 새 레코드 */
  const isUpdate = result.affectedRows === 2;  // 1 row insert + 1 row update
  const reviewId = result.insertId || (
      await db.execute(
        'SELECT id FROM Review WHERE user_id = ? AND destination_id = ?',
        [userId, destinationId]
      )
    )[0][0].id;

  return { reviewId, updated: isUpdate };
};

exports.findByDestinationId = async (destinationId , currentUserId) => {
  console.log(" <<< currentUserId >>> ",currentUserId);
  console.log(" <<< destinationId >>> ",destinationId);
  const [rows] = await db.query(`
    SELECT 
      r.*,
      u.name as user_name,
      CASE WHEN r.user_id = ? THEN 1 ELSE 0 END as is_my_review
    FROM Review r
    JOIN User u ON r.user_id = u.id
    WHERE r.destination_id = ? AND r.status = 1
    ORDER BY 
      r.created_at DESC
  `, [currentUserId, destinationId, currentUserId]);
  return rows;
};

exports.getAllReviews = async () => {
  const [rows] = await db.query(`SELECT * FROM Review WHERE status = 1`);
  return rows;
};

exports.findReviewsByUser = async (userId) => {
  const [rows] = await db.query(`SELECT * FROM Review WHERE user_id = ?`, [userId]);
  return rows;
};

exports.updateReview = async (reviewId, { rating, content }) => {
  await db.query(`
    UPDATE Review 
    SET rating = ?, content = ?, updated_at = NOW() 
    WHERE id = ?
  `, [rating, content, reviewId]);
};

exports.deleteReview = async (reviewId) => {
  await db.query(`
    UPDATE Review 
    SET status = 0, updated_at = NOW() 
    WHERE id = ?
  `, [reviewId]);
};

exports.findHotPlacesLastWeek = async () => {
  /* 지난 7일 리뷰 수, 평균 평점 */
  const [rows] = await db.execute(
    `SELECT
        r.destination_id         AS id,
        td.destination_name      AS title,
        td.image                 AS image,
        COUNT(*)                 AS review_count,
        ROUND(AVG(r.rating),1)   AS rating
     FROM Review r
     JOIN TravelDestination td ON td.id = r.destination_id
     WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY r.destination_id
     ORDER BY review_count DESC, r.destination_id ASC
     LIMIT 6`
  );
  return rows;        // [{id,title,image,review_count,rating}, ...]
};

// 새로 추가: 특정 사용자가 특정 여행지에 리뷰를 작성했는지 확인
exports.hasUserReviewedDestination = async (userId, destinationId) => {
  const [rows] = await db.query(`
    SELECT COUNT(*) as count 
    FROM Review 
    WHERE user_id = ? AND destination_id = ? AND status = 1
  `, [userId, destinationId]);
  
  return rows[0].count > 0; // true/false 반환
};

// 새로 추가: 사용자가 리뷰를 작성한 모든 여행지 ID 목록 반환
exports.getReviewedDestinationIdsByUser = async (userId) => {
  console.log("userId", userId);
  const [rows] = await db.query(`
    SELECT DISTINCT destination_id, rating, review_content
    FROM Review 
    WHERE user_id = ? AND status = 1
  `, [userId]);

  console.log("rows", rows);
  
  return rows.map(row => row.destination_id);
};
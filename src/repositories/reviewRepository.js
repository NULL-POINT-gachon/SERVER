const db = require('../config/database');

exports.insertReview = async (userId, destinationId, rating, content) => {
  console.log("insertReview ▶", { userId, destinationId, rating, content });
  const [result] = await db.query(`
    INSERT INTO Review (user_id, destination_id, rating, review_content, created_at, updated_at, status)
    VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
  `, [userId, destinationId, rating, content]);

  return { reviewId: result.insertId };
};

// reviewRepository.js
exports.upsertReview = async ({ userId, destinationId, rating, content }) => {
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

exports.findByDestinationId = async (destinationId) => {
  const [rows] = await db.query(`
    SELECT * FROM Review 
    WHERE destination_id = ? AND status = 1 
    ORDER BY created_at DESC
  `, [destinationId]);
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
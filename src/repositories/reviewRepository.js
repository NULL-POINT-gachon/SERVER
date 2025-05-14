const db = require('../config/database');

exports.insertReview = async (userId, destinationId, rating, content) => {
  const [result] = await db.query(`
    INSERT INTO Review (user_id, destination_id, rating, content, created_at, updated_at, status)
    VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
  `, [userId, destinationId, rating, content]);

  return { reviewId: result.insertId };
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

const db = require('../config/database');

// 모든 리뷰 목록 조회
exports.findAllReviews = async () => {
  const query = `
    SELECT r.id, r.user_id, u.name as user_name, r.destination_id, 
           d.name as destination_name, r.rating, r.content as review_content, 
           r.created_at, r.updated_at, r.status
    FROM Review r
    JOIN User u ON r.user_id = u.id
    JOIN TravelDestination d ON r.destination_id = d.id
    ORDER BY r.created_at DESC
  `;
  
  try {
    const [reviews] = await db.execute(query);
    return reviews;
  } catch (error) {
    console.error('리뷰 목록 조회 중 오류:', error);
    throw error;
  }
};

// 특정 리뷰 상세 조회
exports.findReviewById = async (reviewId) => {
  const query = `
    SELECT r.id, r.user_id, u.name as user_name, r.destination_id, 
           d.name as destination_name, r.rating, r.content as review_content, 
           r.created_at, r.updated_at, r.status
    FROM Review r
    JOIN User u ON r.user_id = u.id
    JOIN TravelDestination d ON r.destination_id = d.id
    WHERE r.id = ?
  `;
  
  try {
    const [reviews] = await db.execute(query, [reviewId]);
    return reviews[0] || null;
  } catch (error) {
    console.error('리뷰 상세 조회 중 오류:', error);
    throw error;
  }
};

// 리뷰 상태 변경 (활성화/비활성화)
exports.updateReviewStatus = async (reviewId, status) => {
  const query = `
    UPDATE Review
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  try {
    const [result] = await db.execute(query, [status, reviewId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('리뷰 상태 변경 중 오류:', error);
    throw error;
  }
};
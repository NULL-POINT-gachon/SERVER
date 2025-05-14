const db = require('../config/database');

/**
 * 사용자의 모든 알림 조회
 * @param {number} userId - 사용자 ID
 * @param {number} limit - 조회할 알림 수 (기본값: 20)
 * @param {number} offset - 건너뛸 알림 수 (기본값: 0)
 * @returns {Promise<Array>} - 알림 목록
 */
const findByUserId = async (userId, limit = 20, offset = 0) => {
  const query = `
    SELECT n.id, n.user_id, n.type, n.message, n.is_read, n.created_at, 
           n.trip_id, n.sender_id, u.name as sender_name,
           ts.title as trip_title, ts.start_date, ts.end_date, ts.location
    FROM Notification n
    LEFT JOIN User u ON n.sender_id = u.id
    LEFT JOIN TravelSchedule ts ON n.trip_id = ts.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const [notifications] = await db.execute(query, [userId, limit, offset]);
    return notifications;
  } catch (error) {
    console.error('알림 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 특정 알림 단일 조회
 * @param {number} notificationId - 알림 ID
 * @returns {Promise<Object|null>} - 알림 객체 또는 null
 */
const findById = async (notificationId) => {
  const query = `
    SELECT n.id, n.user_id, n.type, n.message, n.is_read, n.created_at, 
           n.trip_id, n.sender_id, u.name as sender_name,
           ts.title as trip_title, ts.start_date, ts.end_date, ts.location
    FROM Notification n
    LEFT JOIN User u ON n.sender_id = u.id
    LEFT JOIN TravelSchedule ts ON n.trip_id = ts.id
    WHERE n.id = ?
  `;

  try {
    const [notifications] = await db.execute(query, [notificationId]);
    return notifications[0] || null;
  } catch (error) {
    console.error('알림 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 새 알림 생성
 * @param {Object} notificationData - 알림 데이터
 * @returns {Promise<number>} - 생성된 알림 ID
 */
const create = async (notificationData) => {
  const { user_id, type, message, trip_id, sender_id } = notificationData;
  
  const query = `
    INSERT INTO Notification 
    (user_id, type, message, trip_id, sender_id) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  try {
    const [result] = await db.execute(query, [
      user_id, type, message, trip_id || null, sender_id || null
    ]);
    return result.insertId;
  } catch (error) {
    console.error('알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 알림 읽음 상태 업데이트
 * @param {number} notificationId - 알림 ID
 * @param {boolean} isRead - 읽음 상태
 * @returns {Promise<boolean>} - 성공 여부
 */
const updateReadStatus = async (notificationId, isRead = true) => {
  const query = `
    UPDATE Notification 
    SET is_read = ? 
    WHERE id = ?
  `;
  
  try {
    const [result] = await db.execute(query, [isRead, notificationId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('알림 상태 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 알림 읽음 처리
 * @param {number} userId - 사용자 ID
 * @returns {Promise<number>} - 변경된 알림 수
 */
const markAllAsRead = async (userId) => {
  const query = `
    UPDATE Notification 
    SET is_read = true 
    WHERE user_id = ? AND is_read = false
  `;
  
  try {
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows;
  } catch (error) {
    console.error('알림 일괄 읽음 처리 중 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 읽지 않은 알림 개수 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<number>} - 읽지 않은 알림 개수
 */
const countUnreadByUserId = async (userId) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM Notification 
    WHERE user_id = ? AND is_read = false
  `;
  
  try {
    const [result] = await db.execute(query, [userId]);
    return result[0].count;
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 중 오류:', error);
    throw error;
  }
};

module.exports = {
  findByUserId,
  findById,
  create,
  updateReadStatus,
  markAllAsRead,
  countUnreadByUserId
};
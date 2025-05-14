const db = require('../config/database');
const userRepo = require('../repositories/userRepository');
const shareRepo = require('../repositories/tripSharerepository');

// ✅ 일정 공유 요청 삽입
exports.insertShare = async ({ sharing_user_id, receiver_user_id, schedule_id, permission_level }) => {
  const sql = `
    INSERT INTO ScheduleShare 
    (sender_user_id, receiver_user_id, schedule_id, permission_level, invite_status, created_at)
    VALUES (?, ?, ?, ?, 'pending', NOW())
  `;
  
  const [result] = await db.query(sql, [
    sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level
  ]);

  return {
    id: result.insertId,
    sender_user_id: sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level,
    invite_status: 'pending',
    created_at: new Date()
  };
};

// ✅ 공유 요청 수락/거절 처리
exports.updateStatus = async (shareId, action) => {
  const sql = `
    UPDATE ScheduleShare
    SET invite_status = ?
    WHERE id = ?
  `;
  await db.query(sql, [action, shareId]);

  return {
    id: Number(shareId),
    invite_status: action
  };
};

// ✅ 공유 요청 취소
exports.cancelShare = async (shareId) => {
  const sql = `
    UPDATE ScheduleShare
    SET invite_status = 'canceled'
    WHERE id = ?
  `;
  await db.query(sql, [shareId]);

  return {
    id: Number(shareId),
    invite_status: 'canceled'
  };
};

// ✅ 공유 요청 단건 조회
exports.findShareById = async (shareId) => {
  const sql = `
    SELECT * FROM ScheduleShare
    WHERE id = ?
  `;
  const [rows] = await db.query(sql, [shareId]);
  return rows[0] || null;
};
const db = require('../config/database');
const userRepo = require('../repositories/userRepository');

// ✅ 일정 공유 요청 삽입
exports.insertShare = async ({ sharing_user_id, receiver_user_id, schedule_id, permission_level }) => {
  const sql = `
  INSERT INTO ScheduleShare
    (sharing_user_id, receiver_user_id, schedule_id,
     permission_level, invitation_status, created_at)
  VALUES (?, ?, ?, ?, 'pending', NOW())
  ON DUPLICATE KEY UPDATE
    permission_level = VALUES(permission_level),
    invitation_status = 'pending',
    updated_at = NOW()
`;
  
  const [result] = await db.query(sql, [
    sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level
  ]);

  return {
    id: result.insertId,
    sharing_user_id: sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level,
    invitation_status: 'pending',
    created_at: new Date()
  };
};

// ✅ 공유 요청 수락/거절 처리
exports.updateStatus = async (shareId, action) => {
  const sql = `
    UPDATE ScheduleShare
    SET invitation_status = ?
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

// ✅ 이메일 초대 조회
exports.findInvitesByReceiverId = async (receiverId) => {
  const sql = `
    SELECT ss.id              AS share_id,
           ss.schedule_id,
           ss.permission_level,
           ss.created_at,
           ts.schedule_name,
           ts.departure_date,          -- 여행 시작일
           ts.end_date,            -- 여행 종료일
           u.name             AS sender_name
    FROM   ScheduleShare ss
    JOIN   TravelSchedule ts  ON ts.id = ss.schedule_id
    JOIN   User           u   ON u.id = ss.sharing_user_id
    WHERE  ss.receiver_user_id = ?
      AND  ss.invitation_status = 'pending'
    ORDER  BY ss.created_at DESC
  `;
  const [rows] = await db.query(sql, [receiverId]);
  return rows;
};

exports.findCollaboratorsByScheduleId = async (scheduleId) => {
  const sql = `
    SELECT u.id, u.name, u.email   
    FROM ScheduleShare ss
    JOIN User u ON ss.receiver_user_id = u.id
    WHERE ss.schedule_id = ? 
    AND ss.invitation_status = 'accepted'
    AND ss.permission_level IN ('edit', 'admin')
  `;
  
  const [rows] = await db.query(sql, [scheduleId]);
  return rows;
};

// 일정 소유자 조회 함수
exports.findScheduleOwner = async (scheduleId) => {
  const sql = `
    SELECT u.id, u.name, u.email 
    FROM TravelSchedule ts
    JOIN User u ON ts.user_id = u.id
    WHERE ts.id = ?
  `;
  
  const [rows] = await db.query(sql, [scheduleId]);
  return rows[0] || null;
};

// 일정 정보 조회 함수 추가 (travelScheduleRepository 대체)
exports.findTripById = async (tripId) => {
  const sql = `
    SELECT * FROM TravelSchedule 
    WHERE id = ?
  `;
  
  const [rows] = await db.query(sql, [tripId]);
  return rows[0] || null;
};
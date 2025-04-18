const db = require('../config/database'); // DB 연결

// 일정 공유 요청 생성
exports.insertShare = async ({
  sharing_user_id,
  receiver_user_id,
  schedule_id,
  permission_level
}) => {
  const sql = `
    INSERT INTO ScheduleShare 
    (sharing_user_id, receiver_user_id, schedule_id, permission_level, invitation_status, created_at)
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
    sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level,
    invitation_status: 'pending',
    created_at: new Date()
  };

  // 👇 목킹 코드 (참고용, 필요 시 사용 가능)
  /*
  return {
    id: Math.floor(Math.random() * 1000),
    sharing_user_id,
    receiver_user_id,
    schedule_id,
    permission_level,
    invitation_status: 'pending',
    created_at: new Date()
  };
  */
};



// 일정 공유 요청 수락/거절 업데이트
exports.updateStatus = async (shareId, action) => {
  const sql = `
    UPDATE ScheduleShare
    SET invitation_status = ?
    WHERE id = ?
  `;

  await db.query(sql, [action, shareId]);

  return {
    id: Number(shareId),
    invitation_status: action
  };

  // 👇 목킹 코드 (참고용)
  /*
  return {
    id: Number(shareId),
    invitation_status: action
  };
  */
};



// 수락된 일정만 조회 (공유받은 일정 목록 조회)
exports.findReceivedAccepted = async (userId) => {
  const sql = `
    SELECT id, sharing_user_id, receiver_user_id, schedule_id, permission_level, invitation_status, created_at
    FROM ScheduleShare
    WHERE receiver_user_id = ? AND invitation_status = 'accepted'
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows;

  // 👇 목킹 코드 (참고용)
  /*
  return [
    {
      id: 101,
      sharing_user_id: 1,
      receiver_user_id: Number(userId),
      schedule_id: 5,
      permission_level: 'edit',
      invitation_status: 'accepted',
      created_at: new Date()
    },
    {
      id: 102,
      sharing_user_id: 2,
      receiver_user_id: Number(userId),
      schedule_id: 7,
      permission_level: 'read',
      invitation_status: 'accepted',
      created_at: new Date()
    }
  ];
  */
};



// 공유 요청 취소
exports.cancelShare = async (shareId) => {
  const sql = `
    UPDATE ScheduleShare
    SET invitation_status = 'canceled'
    WHERE id = ?
  `;

  await db.query(sql, [shareId]);

  return {
    id: Number(shareId),
    invitation_status: 'canceled'
  };

  // 👇 목킹 코드 (참고용)
  /*
  return {
    id: Number(shareId),
    invitation_status: 'canceled'
  };
  */
};
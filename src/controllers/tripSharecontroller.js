const service = require('../services/tripShareservice');
const notificationService = require('../services/notificationService');

// ✅ 이메일 기반 일정 공유 요청
exports.requestShareByEmail = async (req, res, next) => {
  try {
    const { email, schedule_id, permission_level } = req.body;
    console.log(" <<< req.body >>> ", req.body);
    console.log(" <<< req.user >>> ", req.user);
    console.log(" <<< email >>> ",email);
    console.log(" <<< schedule_id >>> ",schedule_id);
    console.log(" <<< permission_level >>> ",permission_level);
    const sharing_user_id = req.user.userId;
    console.log(" <<< sharing_user_id >>> ",sharing_user_id);

    const result = await service.createShareByEmail({
      email,
      schedule_id,
      sharing_user_id,
      permission_level
    });
    //알림
 // 수신자 ID 가져오기 (초대받은 사용자)
    const receiverUserId = result.receiver_user_id || result.receiver_id;
    
    // 알림 생성
    if (receiverUserId) {
      await notificationService.createInviteNotification(
        sharing_user_id,      // 발신자 ID
        receiverUserId,       // 수신자 ID
        schedule_id           // 일정 ID
      );
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ✅ 이메일 초대 수락 처리 (기존: respondToInvitation)
// exports.respondToInvitation = async (req, res, next) => {
//   try {
//     const { token, action } = req.body; // token = shareId
//     const userId = req.user.id;

//     if (action === 'accepted') {
//       const result = await service.acceptInvitation(token, userId);
//       res.status(200).json({
//         message: "일정 공유 요청이 수락되었습니다.",
//         schedule_id: result.new_schedule_id
//       });
//     } else if (action === 'rejected') {
//       const result = await service.updateShareStatus(token, 'rejected');
//       res.status(200).json({
//         message: "일정 공유 요청이 거절되었습니다.",
//         shareId: token
//       });
//     } else {
//       res.status(400).json({ message: "action 값은 'accepted' 또는 'rejected' 여야 합니다." });
//     }
//   } catch (err) {
//     next(err);
//   }
// };
// ✅ 이메일 초대 수락 처리 (기존: respondToInvitation)
exports.respondToInvitation = async (req, res, next) => {
  try {
    console.log(" <<< req.body >>> ", req.body);
    const { token, action } = req.body; // token = shareId
    const userId = req.user.userId;

    console.log(" <<< token >>> ",token);
    console.log(" <<< action >>> ",action);
    console.log(" <<< userId >>> ",userId);

    if (action === 'accepted') {
      const result = await service.acceptInvitation(req.body.shareId, userId); // 수정된 함수 호출
      res.status(200).json({
        message: "일정 공유 요청이 수락되었습니다.",
        schedule_id: result.new_schedule_id
      });
    } else if (action === 'rejected') {
      const result = await service.updateShareStatus(token, 'rejected');
      res.status(200).json({
        message: "일정 공유 요청이 거절되었습니다.",
        shareId: token
      });
    } else {
      res.status(400).json({ message: "action 값은 'accepted' 또는 'rejected' 여야 합니다." });
    }
  } catch (err) {
    next(err);
  }
};
// ✅ 공유 요청 취소
exports.cancelShareRequest = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const result = await service.cancelShare(shareId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
// ✅ GET /trip/share/invite/:shareId
exports.acceptInviteFromEmail = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const result = await service.acceptInvitation(shareId, userId);
    res.status(200).json({
      message: "초대 링크 수락이 완료되었습니다.",
      schedule_id: result.new_schedule_id
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyInvites = async (req, res, next) => {
  try {
    const rows = await service.getInvitesForUser(req.user.userId);

    console.log(" <<< rows >>> ",rows);

    const notifications = rows.map((r) => ({
      id:          r.share_id,          // 드롭다운에서 shareId 로 사용
      type:        "invite",
      sender_name: r.sender_name,
      trip_title:  r.schedule_name,
      start_date:  r.departure_date,
      end_date:    r.end_date,
      schedule_id: r.schedule_id,
      created_at:  r.created_at,
      /* 드롭다운에 바로 찍을 메시지 */
      message: `${r.sender_name}님이 ‘${r.schedule_name}’ 일정을 공유했습니다.`,
      is_read: false,                  // 읽음 기능은 아직 없으므로 고정
    }));

    res.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (e) {
    next(e);
  }
};
const service = require('../services/tripShareservice');

// ✅ 이메일 기반 일정 공유 요청
exports.requestShareByEmail = async (req, res, next) => {
  try {
    const { email, schedule_id, permission_level } = req.body;
    const sharing_user_id = req.user.id;

    const result = await service.createShareByEmail({
      email,
      schedule_id,
      sharing_user_id,
      permission_level
    });

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
    const { token, action } = req.body; // token = shareId
    const userId = req.user.id;

    if (action === 'accepted') {
      const result = await service.acceptInvitation(token, userId); // 수정된 함수 호출
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
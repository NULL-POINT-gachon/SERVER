const userRepo = require('../repositories/userRepository');        // 이메일 사용자 조회
const shareRepo = require('../repositories/tripSharerepository'); // 공유 요청 저장/조회
const tripRepo = require('../repositories/tripRepository');       // 일정 복제용
const { sendShareInvitation } = require('../utils/emailSender');  // 이메일 전송

// ✅ 이메일 기반 공유 요청 (초대 메일 발송 포함)
exports.createShareByEmail = async ({ email, schedule_id, sharing_user_id, permission_level }) => {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    const error = new Error('등록되지 않은 사용자입니다.');
    error.status = 404;
    throw error;
  }

  console.log(" <<< sharing_user_id >>> ",sharing_user_id);
  console.log(" <<< user.id >>> ",user.id);
  console.log(" <<< schedule_id >>> ",schedule_id);
  console.log(" <<< permission_level >>> ",permission_level);
  const shareRecord = await shareRepo.insertShare({
    sharing_user_id,
    receiver_user_id: user.id,
    schedule_id,
    permission_level
  });

  await sendShareInvitation({ toEmail: email, shareId: shareRecord.id });

  return { message: "초대 링크가 전송되었습니다." ,
     receiver_user_id: user.id
  }
  ;
};

// ✅ 공유 요청 수락/거절
exports.updateShareStatus = async (shareId, action) => {
  return await shareRepo.updateStatus(shareId, action);
};

// ✅ 공유 요청 취소
exports.cancelShare = async (shareId) => {
  return await shareRepo.cancelShare(shareId);
};

// ✅ 초대 수락 처리 (상태 변경 + 일정 복제)
exports.acceptInvitation = async (shareId, userId) => {
  console.log(" <<< shareId >>> ",shareId);
  console.log(" <<< userId >>> ",userId);
  const share = await shareRepo.findShareById(shareId);
  console.log(" <<< share >>> ",share);
  if (!share) {
    const err = new Error("해당 공유 요청을 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }

  if (share.invitation_status !== 'pending') {
    const err = new Error("이미 처리된 공유 요청입니다.");
    err.status = 400;
    throw err;
  }

  // 1. 상태 업데이트 (수락)
  await shareRepo.updateStatus(shareId, 'accepted');

  // 2. 일정 복제
  const newScheduleId = await tripRepo.cloneScheduleForUser(share.schedule_id, userId);

  return {
    message: '일정을 성공적으로 수락하고 복제했습니다.',
    new_schedule_id: newScheduleId
  };
};

// 받은 초대 목록 조회
exports.getInvitesForUser = async (userId) => {
  return await shareRepo.findInvitesByReceiverId(userId);
};

const repo = require('../repositories/tripSharerepository');
const notificationService = require('../services/notificationService');

exports.createShare = async (data) => {
  const share = await repo.insertShare(data);
  
  // 일정 공유 초대 알림 생성
  await notificationService.createInviteNotification(
    data.sharing_user_id, 
    data.receiver_user_id, 
    data.schedule_id
  );
  
  return share;
};

exports.updateShareStatus = async (shareId, action) => {
  // 검증 추가해도 좋음: if action not in ['accepted', 'rejected']
  return await repo.updateStatus(shareId, action);
};

exports.getAcceptedShares = async (userId) => {
  return await repo.findReceivedAccepted(userId);
};

exports.cancelShare = async (shareId) => {
  return await repo.cancelShare(shareId);
};
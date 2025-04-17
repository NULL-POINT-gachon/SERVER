const repo = require('../repositories/tripSharerepository');

exports.createShare = async (data) => {
  return await repo.insertShare(data);
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
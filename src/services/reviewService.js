const reviewRepository = require('../repositories/reviewRepository');
const notificationService = require('../services/notificationService');

exports.createReview = async ({ userId, destinationId, rating, content }) => {
  const review = await reviewRepository.insertReview(userId, destinationId, rating, content);
  
  // 리뷰 작성 시 알림 생성 (필요한 경우)
  await notificationService.createCommentNotification(userId, destinationId);
  
  return review;
  

};

exports.getHotPlaces = async () => reviewRepository.findHotPlacesLastWeek();

exports.upsertReview = async ({ userId, destinationId, rating, content }) => {
  return await reviewRepository.upsertReview({ userId, destinationId, rating, content });
};

exports.getReviewsByDestination = async (destinationId) => {
  return await reviewRepository.findByDestinationId(destinationId);
};
exports.getAllReviews = async () => {
  return await reviewRepository.getAllReviews();
};
exports.getReviewsByUser = async (userId) => {
  return await reviewRepository.findReviewsByUser(userId);
};
exports.updateReview = async (reviewId, data) => {
  await reviewRepository.updateReview(reviewId, data);
};

exports.deleteReview = async (reviewId) => {
  await reviewRepository.deleteReview(reviewId);
};

//  새로 추가: 사용자가 리뷰를 작성한 여행지 ID 목록 반환
exports.getReviewedDestinationsByUser = async (userId) => {
  return await reviewRepository.getReviewedDestinationIdsByUser(userId);
};

//  새로 추가: 특정 사용자가 특정 여행지에 리뷰를 작성했는지 확인
exports.hasUserReviewedDestination = async (userId, destinationId) => {
  return await reviewRepository.hasUserReviewedDestination(userId, destinationId);
};
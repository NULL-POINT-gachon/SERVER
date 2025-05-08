const reviewRepository = require('../repositories/reviewRepository');
const notificationService = require('../services/notificationService');

exports.createReview = async ({ userId, destinationId, rating, content }) => {
  const review = await reviewRepository.insertReview(userId, destinationId, rating, content);
  
  // 리뷰 작성 시 알림 생성 (필요한 경우)
  await notificationService.createCommentNotification(userId, destinationId);
  
  return review;
  

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
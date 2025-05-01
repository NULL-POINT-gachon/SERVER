const reviewRepository = require('../repositories/reviewRepository');

exports.createReview = async ({ userId, destinationId, rating, content }) => {
  return await reviewRepository.insertReview(userId, destinationId, rating, content);
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
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
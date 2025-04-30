const reviewRepository = require('../repositories/reviewRepository');

exports.createReview = async ({ userId, destinationId, rating, content }) => {
  return await reviewRepository.insertReview(userId, destinationId, rating, content);
};
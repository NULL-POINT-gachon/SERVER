const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { destination_id, rating, content } = req.body;

    const result = await reviewService.createReview({
      userId,
      destinationId: destination_id,
      rating,
      content
    });

    res.status(201).json({ message: '리뷰 작성 성공', reviewId: result.reviewId });
  } catch (error) {
    console.error('리뷰 작성 실패:', error);
    res.status(500).json({ message: '리뷰 작성 실패' });
  }
};


exports.getReviewsByPlace = async (req, res) => {
  try {
    const destinationId = Number(req.params.destinationId);
    const reviews = await reviewService.getReviewsByDestination(destinationId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({ message: '리뷰 조회 실패' });
  }
};
exports.getAllReviews = async (req, res) => {
  try {
    const result = await reviewService.getAllReviews();
    res.status(200).json(result);
  } catch (error) {
    console.error('모든 리뷰 조회 오류:', error);
    res.status(500).json({ message: '리뷰 조회 실패' });
  }
};
const adminReviewService = require('../services/adminReviewService');

// 모든 리뷰 목록 조회
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await adminReviewService.getAllReviews();
    
    res.status(200).json({
      success: true,
      message: '리뷰 목록 조회 성공',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// 특정 리뷰 상세 조회
exports.getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await adminReviewService.getReviewById(reviewId);
    
    res.status(200).json({
      success: true,
      message: '리뷰 상세 조회 성공',
      data: review
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// 리뷰 상태 변경 (활성화/비활성화)
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    
    // status를 숫자로 변환
    const statusNum = parseInt(status, 10);
    
    const result = await adminReviewService.updateReviewStatus(reviewId, statusNum);
    
    res.status(200).json({
      success: true,
      message: '리뷰 상태 변경 성공',
      data: result
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
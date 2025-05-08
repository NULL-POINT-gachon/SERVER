const adminReviewRepository = require('../repositories/adminReviewRepository');

// 모든 리뷰 목록 조회
exports.getAllReviews = async () => {
  try {
    return await adminReviewRepository.findAllReviews();
  } catch (error) {
    console.error('리뷰 목록 조회 서비스 오류:', error);
    throw {
      status: 500,
      message: '리뷰 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
};

// 특정 리뷰 상세 조회
exports.getReviewById = async (reviewId) => {
  try {
    const review = await adminReviewRepository.findReviewById(reviewId);
    
    if (!review) {
      throw {
        status: 404,
        message: '리뷰를 찾을 수 없습니다.'
      };
    }
    
    return review;
  } catch (error) {
    console.error('리뷰 상세 조회 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '리뷰 상세 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
};

// 리뷰 상태 변경 (활성화/비활성화)
exports.updateReviewStatus = async (reviewId, status) => {
  try {
    // 유효한 상태값인지 확인 (0: 비활성화, 1: 활성화)
    if (status !== 0 && status !== 1) {
      throw {
        status: 400,
        message: '유효하지 않은 상태값입니다. 0 또는 1이어야 합니다.'
      };
    }
    
    // 리뷰가 존재하는지 확인
    const review = await adminReviewRepository.findReviewById(reviewId);
    if (!review) {
      throw {
        status: 404,
        message: '리뷰를 찾을 수 없습니다.'
      };
    }
    
    // 리뷰 상태 업데이트
    const success = await adminReviewRepository.updateReviewStatus(reviewId, status);
    
    if (!success) {
      throw {
        status: 500,
        message: '리뷰 상태 변경에 실패했습니다.'
      };
    }
    
    return {
      id: reviewId,
      status: status,
      success: true
    };
  } catch (error) {
    console.error('리뷰 상태 변경 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '리뷰 상태 변경 중 오류가 발생했습니다.'
    };
  }
};
const reviewService = require('../services/reviewService');
const tripService = require('../services/tripService');
//알림
const notificationService = require('../services/notificationService');

exports.createReview = async (req, res) => {
  try {
    console.log("createReview ▶", req.body);
    const userId = req.user.userId;
    const { destination_name, rating, content } = req.body;

    const destinationId = await tripService.getDestinationIdByName(destination_name);

    const result = await reviewService.createReview({
      userId,
      destinationId,
      rating,
      content
    });

    // 해당 여행지가 속한 일정 ID 찾기
    const scheduleId = await tripService.getScheduleIdByDestinationId(destinationId);
    
    // 관련 일정이 있는 경우에만 알림 생성
    if (scheduleId) {
      try {
        await notificationService.createCommentNotification(
          userId,    // 댓글 작성자 ID
          scheduleId // 여행 일정 ID
        );
      } catch (notificationError) {
        console.error('리뷰 알림 생성 실패:', notificationError);
        // 알림 생성 실패해도 리뷰 작성은 성공으로 처리
      }
    }


    res.status(201).json({ message: '리뷰 작성 성공', reviewId: result.reviewId });
  } catch (error) {
    console.error('리뷰 작성 실패:', error);
    res.status(500).json({ message: '리뷰 작성 실패' });
  }
};

exports.getHotPlaces = async (req, res) => {
  try {
    const list = await reviewService.getHotPlaces();
    res.json({ result_code: 200, data: list });
  } catch (e) {
    console.error('hot places 조회 실패:', e);
    res.status(500).json({ message: 'hot places 조회 실패' });
  }
};

exports.createOrUpdateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { destination_id, destination_name, rating, content } = req.body;

    let destId = destination_id;
    if (!destId) {
      if (!destination_name)
        return res.status(400).json({ message: 'destination_id 또는 destination_name 필요' });
      destId = await tripService.getDestinationIdByName(destination_name);
      if (!destId)
        return res.status(404).json({ message: '여행지를 찾을 수 없습니다' });
    }

    const { reviewId, updated } = await reviewService.upsertReview({
      userId, destinationId: destId, rating, content
    });

    res.status(updated ? 200 : 201).json({
      message: updated ? '리뷰가 수정되었습니다' : '리뷰가 작성되었습니다',
      reviewId
    });
  } catch (err) {
    console.error('리뷰 저장 실패:', err);
    res.status(500).json({ message: '리뷰 저장 실패' });
  }
};

exports.getReviewsByPlace = async (req, res) => {
  try {
    const destinationId = Number(req.params.destinationId);
    const currentUserId = req.user.userId; // 현재 로그인한 사용자 ID

    const reviews = await reviewService.getReviewsByDestination(destinationId , currentUserId);
    console.log("reviews >>> ", reviews);
    res.status(200).json({data : reviews});
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
exports.getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewService.getReviewsByUser(userId);
    res.status(200).json(reviews);
  } catch (err) {
    console.error('리뷰 조회 오류:', err);
    res.status(500).json({ message: '리뷰 목록 조회 실패' });
  }
};
exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, content } = req.body;

  try {
    await reviewService.updateReview(Number(reviewId), { rating, content });
    res.status(200).json({ message: '리뷰가 수정되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '리뷰 수정 실패', error });
  }
};

exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    await reviewService.deleteReview(Number(reviewId));
    res.status(200).json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '리뷰 삭제 실패', error });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reviews = await reviewService.getUserReviews(userId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error('사용자 리뷰 조회 오류:', error);
    res.status(500).json({ message: '사용자 리뷰 조회 실패' });
  }
};


// 새로 추가: 사용자가 리뷰를 작성한 여행지 목록 조회
exports.getUserReviewedDestinations = async (req, res) => {
  try {
    const userId = req.user.userId; // 인증된 사용자 ID
    const reviewedDestinations = await reviewService.getReviewedDestinationsByUser(userId);
    
    res.status(200).json({ 
      data: reviewedDestinations 
    });
  } catch (error) {
    console.error('리뷰 작성 여행지 조회 오류:', error);
    res.status(500).json({ 
      message: '리뷰 작성 여행지 조회 실패' 
    });
  }
};
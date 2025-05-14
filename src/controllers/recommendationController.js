// src/controllers/recommendationController.js
const recommendationService = require('../services/recommendationService');
const { RecommendationRequestDto } = require('../dtos/recommendationDto');

const getRecommendations = async (req, res, next) => {
  try {
    /**
     * start_date: travelData.dateRange[0],   // ISO 문자열이 가장 안전
              end_date:   travelData.dateRange[1],
              companions_count: travelData.people,
              emotion_ids
     */
    // 요청 본문에서 데이터 추출
    const { start_date, end_date, companions_count, emotion_ids } = req.body;
    
    // 유효성 검사
    if (!start_date || !end_date || !companions_count || !emotion_ids) {
      return res.status(400).json({
        success: false,
        message: '필수 입력 필드가 누락되었습니다'
      });
    }
    
    // DTO 생성
    const requestDto = new RecommendationRequestDto(
      start_date,
      end_date,
      companions_count,
      emotion_ids
    );
    console.log(requestDto);
    
    // 사용자 ID 가져오기 (인증 미들웨어에서 설정된 값)
    const userId = req.user.userId;
    
    // 서비스 호출
    const recommendations = await recommendationService.getRecommendations(userId, requestDto);
    console.log("recommendations", recommendations);
    // 응답
    res.status(200).json({
      success: true,
      data: {
        user_id: recommendations.userId,
        trip_id: recommendations.tripId,
        recommendations: recommendations.recommendations
      }
    });
    
  } catch (error) {
    console.error('추천 컨트롤러 오류:', error);
    
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

module.exports = {
  getRecommendations
};
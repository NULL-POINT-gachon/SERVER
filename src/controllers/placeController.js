// src/controllers/placeController.js
const placeService = require('../services/placeService');
const { PlacePreferenceDto } = require('../dtos/placePreferenceDto');
const { FinalPlacePreferenceDto } = require('../dtos/FinalPlacePreferenceDto');

const getPlaceRecommendations = async (req, res, next) => {
  try {
    // 요청 본문에서 데이터 추출
    const { city, activity_type, activity_ids, emotion_ids, preferred_transport, companion, activity_level } = req.body;
    
    // 유효성 검사
    if (!city || !activity_type || !activity_ids || !emotion_ids || !preferred_transport || !companion) {
      console.log(req.body);
      return res.status(400).json({
        success: false,
        message: "필수 입력 필드가 누락되었습니다"
      });
    }
    
    // DTO 생성
    const preferenceDto = new PlacePreferenceDto(
      city,
      activity_type,
      activity_ids,
      emotion_ids,
      preferred_transport, // 오타 주의: API에서는 preffer_transport로 받고, AI로 보낼때 preferred_transport로 변환
      companion,
      activity_level
    );
    
    // 사용자 ID 가져오기 (인증 미들웨어에서 설정된 값)
    const userId = req.user.userId;
    
    // 서비스 호출
    const recommendations = await placeService.getPlaceRecommendations(userId, preferenceDto);
    
    // 응답
    res.status(200).json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('여행지 추천 컨트롤러 오류:', error);
    
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};


const getFinalPlaceRecommendations = async (req, res, next) => {
  try {
    const { city, activity_type, activity_ids, emotion_ids, preferred_transport, companion, activity_level, place_name, trip_duration, trip_id } = req.body;

    if (!city || !activity_type || !activity_ids || !emotion_ids || !preferred_transport || !companion || !place_name || !trip_duration || !trip_id) {
      return res.status(400).json({
        success: false,
        message: "필수 입력 필드가 누락되었습니다"
      });
    }

    const preferenceDto = new FinalPlacePreferenceDto(
      city,
      activity_type,
      activity_ids,
      emotion_ids,
      preferred_transport,
      companion,
      activity_level,
      place_name,
      trip_duration
    );

    const userId = req.user.userId;

    const recommendations = await placeService.getFinalPlaceRecommendations(userId, preferenceDto, trip_id);

    res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('여행지 추천 컨트롤러 오류:', error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
}

module.exports = {
  getPlaceRecommendations,
  getFinalPlaceRecommendations
};
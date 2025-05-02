// src/dtos/recommendationDto.js
class RecommendationRequestDto {
    constructor(startDate, endDate, companionsCount, emotionIds) {
      this.startDate = startDate;
      this.endDate = endDate;
      this.companionsCount = companionsCount;
      this.emotionIds = emotionIds;
    }
  
    // AI 서비스 요청 형식으로 변환
    toAIRequestFormat() {
      // 여행 시작일과 종료일로 기간 계산
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const tripDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
      return {
        trip_duration: tripDuration,
        companions_count: this.companionsCount,
        emotion_ids: this.emotionIds,
        top_n: 3,
        recommendation_type: "both",
        alpha: 0.7
      };
    }
  }
  
  class RecommendationResponseDto {
    constructor(userId, recommendations) {
      this.userId = userId;
      this.recommendations = recommendations;
    }
  }
  
  module.exports = {
    RecommendationRequestDto,
    RecommendationResponseDto
  };
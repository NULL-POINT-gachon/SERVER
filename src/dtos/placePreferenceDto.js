// src/dtos/placePreferenceDto.js
class PlacePreferenceDto {
    constructor(city, activityType, activityIds, emotionIds, preferredTransport, companionsCount, activityLevel) {
      this.city = city;
      this.activityType = activityType;
      this.activityIds = activityIds;
      this.emotionIds = emotionIds;
      this.preferredTransport = preferredTransport;
      this.companionsCount = companionsCount;
      this.activityLevel = activityLevel;
    }
  
    // AI 서비스 요청 형식으로 변환
    toAIRequestFormat() {
      return {
        city: this.city,
        activity_type: this.activityType,
        activity_ids: this.activityIds,
        emotion_ids: this.emotionIds,
        preferred_transport: this.preferredTransport,
        companions_count: this.companionsCount,
        activity_level: this.activityLevel,
        top_n: 3,
        recommendation_type: "both",
        alpha: 0.7
      };
    }
  }
  
  class PlaceRecommendationDto {
    constructor(places) {
      this.places = places;
    }
  }
  
  module.exports = {
    PlacePreferenceDto,
    PlaceRecommendationDto
  };
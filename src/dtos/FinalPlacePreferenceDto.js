// src/dtos/FinalPlacePreferenceDto.js
class FinalPlacePreferenceDto {
    constructor(city, activityType, activityIds, emotionIds, preferredTransport, companionsCount, activityLevel, placeName, tripDuration, visit_date, departure_date) 
    {
      this.city               = city;
      this.activityType       = activityType;
      this.activityIds        = activityIds;
      this.emotionIds         = emotionIds;
      this.preferredTransport = preferredTransport;
      this.companionsCount    = companionsCount;
      this.activityLevel      = activityLevel;
      this.placeName          = placeName;
      this.tripDuration       = tripDuration;
      this.visit_date         = visit_date;
      this.departure_date     = departure_date;
    }
  
    /** Python 스크립트용 포맷 */
    toAIRequestFormat() {
      return {
        city:               this.city,
        activity_type:      this.activityType,
        activity_ids:       this.activityIds,
        emotion_ids:        this.emotionIds,
        preferred_transport:this.preferredTransport,
        companions_count:   this.companionsCount,
        activity_level:     this.activityLevel,
        place_name:         this.placeName,
        trip_duration:      this.tripDuration,
        top_n:              Math.max(1, 2 * this.activityLevel), // 활동량×2
        recommendation_type:"both",
        alpha:              0.7,
      };
    }
  }
  
  class FinalPlaceRecommendationDto {
    /** @param {Object} plan { days:[ { day, items:[…] }, … ] } */
    constructor(plan) {
      this.days = plan.days;
    }
  }
  
  module.exports = {
    FinalPlacePreferenceDto,
    FinalPlaceRecommendationDto,
  };
  
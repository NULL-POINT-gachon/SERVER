// src/dtos/tripDto.js
class TripCreateDto {
    constructor(tripName, departureDate, endDate, travel_status = '계획', selectedPlaceId = null) {
      this.tripName = tripName;
      this.departureDate = departureDate;
      this.endDate = endDate;
      this.travel_status = travel_status;
      this.selectedPlaceId = selectedPlaceId;
    }
  
    // 유효성 검사
    validate() {
      const errors = {};
      
      if (!this.tripName || this.tripName.trim().length < 2) {
        errors.tripName = '여행 일정명은 2자 이상이어야 합니다';
      }
      
      if (!this.departureDate) {
        errors.departureDate = '출발 일자는 필수입니다';
      }
      
      if (!this.endDate) {
        errors.endDate = '마무리 일자는 필수입니다';
      }
      
      // 날짜 형식 검사
      if (this.departureDate && this.endDate) {
        const startDate = new Date(this.departureDate);
        const endDate = new Date(this.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.dateFormat = '유효한 날짜 형식이 아닙니다 (YYYY-MM-DD)';
        } else if (startDate > endDate) {
          errors.dateRange = '출발 일자는 마무리 일자보다 빨라야 합니다';
        }
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    }
  }
  
  class TripResponseDto {
    constructor(result_code, message, scheduleId) {
      this.result_code = result_code;
      this.message = message;
      this.식별자 = scheduleId;
    }
  }
  
  module.exports = {
    TripCreateDto,
    TripResponseDto
  };
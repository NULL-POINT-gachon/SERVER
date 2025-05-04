// src/services/tripService.js

const tripRepository = require('../repositories/tripRepository');
const { TripResponseDto } = require('../dtos/tripDto');

// 여행 일정 생성 서비스 함수
exports.createTrip = async (userId, tripDto) => {
  try {
    // 유효성 검사: DTO의 validate 메서드 활용
    const validationErrors = tripDto.validate();
    if (validationErrors) {
      throw { status: 400, message: '유효성 검사 실패', errors: validationErrors };
    }
    
    // 여행지 검증: 선택한 여행지가 있는 경우만 확인
    if (tripDto.selectedPlaceId) {
      const place = await tripRepository.getPlaceById(tripDto.selectedPlaceId);
      if (!place) {
        throw { status: 404, message: '선택한 여행지를 찾을 수 없습니다' };
      }
    }
    
    // 데이터베이스에 여행 일정 생성
    const scheduleId = await tripRepository.createTrip(userId, {
      tripName: tripDto.tripName,
      departureDate: tripDto.departureDate,
      endDate: tripDto.endDate,
      travel_status: tripDto.travel_status
    });
    
    // 여행지가 선택된 경우에만 일정과 여행지 연결
    if (tripDto.selectedPlaceId) {
      await tripRepository.linkTripWithPlace(scheduleId, tripDto.selectedPlaceId);
    }
    
    // 성공 응답 DTO 반환
    return new TripResponseDto(200, '여행 일정이 생성되었습니다.', scheduleId);
    
  } catch (error) {
    console.error('여행 일정 생성 서비스 오류:', error);
    
    // 이미 status가 있는 에러는 그대로 전달
    if (error.status) {
      throw error;
    }
    
    // 예상치 못한 에러는 500으로 처리
    throw { status: 500, message: '여행 일정 생성 중 서버 오류가 발생했습니다' };
  }
};

// 전체 여행 일정 조회 서비스 함수
exports.getAllTrips = async (userId, page, limit, travel_status) => {
    try {
      // 페이지네이션 유효성 검사
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      
      if (pageNum < 1 || limitNum < 1) {
        throw { status: 400, message: '잘못된 페이지 또는 제한 값입니다' };
      }
      
      // 전체 개수 조회
      const totalCount = await tripRepository.getTotalTripCount(userId, travel_status);
      
      // 여행 일정 데이터 조회
      const trips = await tripRepository.getAllTrips(userId, pageNum, limitNum, travel_status);
      
      // 응답 형식에 맞게 데이터 변환
      const formattedTrips = trips.map(trip => ({
        식별자: trip.id,
        여행일정명: trip.schedule_name,
        출발일자: trip.departure_date,
        마무리일자: trip.end_date,
        '여행상태ex) (계획, 진행중, 완료 , 취소)': trip.travel_status,
        생성일자: trip.created_at  // ISO 8601 형식으로 자동 변환됨
      }));
      
      return {
        result_code: 200,
        total_count: totalCount,
        trips: formattedTrips
      };
      
    } catch (error) {
      console.error('전체 여행 일정 조회 서비스 오류:', error);
      
      if (error.status) {
        throw error;
      }
      
      throw { status: 500, message: '여행 일정 조회 중 서버 오류가 발생했습니다' };
    }
  };
const tripService = require('../services/routeOptimizerService');
const tripservice = require('../services/tripService');

const { TripCreateDto } = require('../dtos/tripDto');


// 🔁 AI 서버 결과 기반 경로 최적화 API
exports.optimizeRouteFromClientData = async (req, res) => {
  try {
    const { tripId } = req.params;
    const optimizeRequestDto = req.body; // 수정한 부분
    const result = await tripService.optimizeRouteFromClientData(optimizeRequestDto); // 수정한 부분

    res.status(200).json(result);
  } catch (error) {
    console.error('AI 장소 기반 최적경로 계산 오류:', error);
    res.status(500).json({ message: '최적 경로 계산 실패' });
  }
};

exports.getOptimizedRoute = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await tripService.getOptimizedRouteByTripId(tripId);
    res.json(result);
  } catch (error) {
    console.error('경로 최적화 중 오류:', error);
    res.status(500).json({ message: '최적 경로 계산 실패' });
  }
};

exports.saveOptimizedRoute = async (req, res) => {
  try {
    const { tripId } = req.params;
    const data = req.body;
    await tripService.saveOptimizedRoute(tripId, data);
    res.status(200).json({ message: '최적 경로 저장 완료' });
  } catch (error) {
    console.error('최적 경로 저장 중 오류:', error);
    res.status(500).json({ message: '최적 경로 저장 실패' });
  }
};

exports.getTotalDistanceAndTime = async (req, res) => {
  const tripId = Number(req.params.tripId);
  const result = await tripService.calculateTotalDistanceAndTime(tripId);
  res.status(200).json(result);
};

exports.optimizeSchedule = async (req, res) => {
  try {
    const scheduleId = Number(req.params.scheduleId);
    await tripService.optimizeScheduleById(scheduleId);
    res.status(200).json({
      scheduleId,
      optimized: true,
      message: '최적 경로 계산 완료'
    });
  } catch (error) {
    console.error('스케줄 최적화 중 오류:', error);
    res.status(500).json({ message: '최적 경로 계산 실패' });
  }
};

exports.updateTransportation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { transportation_id } = req.body;
    await tripService.updateTransportation(tripId, transportation_id);
    res.status(200).json({
      tripId: Number(tripId),
      transportation_id,
      message: '이동수단 변경 완료'
    });
  } catch (error) {
    console.error('이동수단 변경 중 오류:', error);
    res.status(500).json({ message: '이동수단 변경 실패' });
  }
};

exports.getMapMarkers = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await tripService.getOptimizedRouteByTripId(tripId);

    const mapData = {};
    for (const [date, places] of Object.entries(result)) {
      mapData[date] = places.map(place => ({
        placeId: place.placeId,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        order: place.order
      }));
    }

    res.status(200).json(mapData);
  } catch (error) {
    console.error('지도 데이터 조회 중 오류:', error);
    res.status(500).json({ message: '지도 표시용 데이터 불러오기 실패' });
  }
};

exports.optimizeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await tripService.getOptimizedRouteByTripId(tripId);
    res.status(200).json(result);
  } catch (error) {
    console.error('여행 일정 재최적화 중 오류:', error);
    res.status(500).json({ message: '일정 재최적화 실패' });
  }
};

// 여행 일정 생성 컨트롤러 함수
exports.createTrip = async (req, res, next) => {
  try {
    // 요청 본문에서 필요한 데이터 추출
    const { 여행일정명, 출발일자, 마무리일자, 선택한_여행지_id, 도시} = req.body;
    
    // JWT 인증 미들웨어에서 설정한 사용자 ID 가져오기
    const userId = req.user.id;
    console.log(userId);
    
    // 데이터 검증과 타입 변환을 위한 DTO 객체 생성
    const tripDto = new TripCreateDto(
      여행일정명,
      출발일자,
      마무리일자,
      '계획',
      선택한_여행지_id,
      도시
    );
    
    // 비즈니스 로직 처리를 서비스에 위임
    const result = await tripservice.createTrip(userId, tripDto);
    console.log(result);
    
    // 성공 응답 반환
    res.status(200).json(result);
    
  } catch (error) {
    console.error('여행 일정 생성 컨트롤러 오류:', error);
    
    // 커스텀 에러가 있는 경우 해당 상태 코드로 응답
    if (error.status) {
      return res.status(error.status).json({
        result_code: error.status,
        message: error.message,
        errors: error.errors
      });
    }
    
    // 예외처리 미들웨어로 전달
    next(error);
  }
};

// 전체 여행 일정 조회 컨트롤러 함수
exports.getAllTrips = async (req, res, next) => {
  try {
    // 쿼리 파라미터에서 데이터 추출 및 디코딩 처리
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    // URL 인코딩된 '여행상태ex) (계획, 진행중, 완료 , 취소)' 파라미터를 디코딩
    let travelStatus = null;
    
    // 쿼리 파라미터에서 여행 상태 추출 (한글 파라미터 처리)
    const queryKeys = Object.keys(req.query);
    queryKeys.forEach(key => {
      if (key.includes('여행상태')) {
        travelStatus = req.query[key];
      }
    });
    
    // JWT 인증 미들웨어에서 설정한 사용자 ID 가져오기
    const userId = req.user.userId;
    
    // 비즈니스 로직 처리를 서비스에 위임
    const result = await tripservice.getAllTrips(userId, page, limit, travelStatus);
    
    // 성공 응답 반환
    res.status(200).json(result);
    
  } catch (error) {
    console.error('전체 여행 일정 조회 컨트롤러 오류:', error);
    
    // 커스텀 에러가 있는 경우 해당 상태 코드로 응답
    if (error.status) {
      return res.status(error.status).json({
        result_code: error.status,
        message: error.message
      });
    }
    
    // 예외 처리 미들웨어로 전달
    next(error);
  }
};

// 여행 일정 상세 조회 컨트롤러 함수
exports.getTripDetail = async (req, res, next) => {
  try {
    // Path 파라미터에서 tripId 추출
    const { tripId } = req.params;
    
    // JWT 인증 미들웨어에서 설정한 사용자 ID 가져오기
    const userId = req.user.userId;
    
    // 서비스 함수 호출
    const result = await tripservice.getTripDetail(userId, tripId);
    
    // 성공 응답 반환
    res.status(200).json(result);
    
  } catch (error) {
    console.error('여행 일정 상세 조회 컨트롤러 오류:', error);
    
    // 커스텀 에러 처리
    if (error.status) {
      return res.status(error.status).json({
        result_code: error.status,
        message: error.message
      });
    }
    
    // 예외 처리 미들웨어로 전달
    next(error);
  }
};

// src/controllers/tripController.js 확인

exports.updateTripBasicInfo = async (req, res, next) => {
  try {
    // Path 파라미터에서 tripId 추출
    const { tripId } = req.params;
    const userId = req.user.userId;

    // 요청 본문에서 필요한 데이터 추출
    const { 일정명, 여행상태 } = req.body;
    
    // 디버깅 로그 추가
    console.log('컨트롤러 요청 데이터:', req.body);
    console.log('asd' , req.user.userId);
    // JWT 인증 미들웨어에서 설정한 사용자 ID 가져오기
    
    // 서비스 함수 호출
    const result = await tripservice.updateTripBasicInfo(userId, tripId, {
      일정명,
      여행상태
    });
    
    // 성공 응답 반환
    res.status(200).json(result);
    
  } catch (error) {
    console.error('여행 일정 수정 컨트롤러 오류:', error);
    
    // 커스텀 에러 처리
    if (error.status) {
      return res.status(error.status).json({
        result_code: error.status,
        message: error.message
      });
    }
    
    // 예외 처리 미들웨어로 전달
    next(error);
  }
};
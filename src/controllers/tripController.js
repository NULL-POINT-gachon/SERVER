const tripService = require('../services/routeOptimizerService');

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
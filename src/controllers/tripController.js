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
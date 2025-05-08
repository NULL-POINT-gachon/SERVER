const adminDestinationService = require('../services/adminDestinationService');

// 모든 여행지 목록 조회
exports.getAllDestinations = async (req, res, next) => {
  try {
    const destinations = await adminDestinationService.getAllDestinations();
    
    res.status(200).json({
      success: true,
      message: '여행지 목록 조회 성공',
      data: destinations
    });
  } catch (error) {
    next(error);
  }
};

// 특정 여행지 상세 조회
exports.getDestinationById = async (req, res, next) => {
  try {
    const { destinationId } = req.params;
    const destination = await adminDestinationService.getDestinationById(destinationId);
    
    res.status(200).json({
      success: true,
      message: '여행지 상세 조회 성공',
      data: destination
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
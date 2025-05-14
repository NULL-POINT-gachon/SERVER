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
exports.getDestinationById = async (req, res) => {
  try {
    const destination = await adminDestinationService.getDestinationById(req.params.destinationId);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: '여행지를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error('여행지 상세 조회 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '여행지 상세 정보를 가져오는 중 오류가 발생했습니다.'
    });
  }
};

// 여행지 등록
exports.createDestination = async (req, res, next) => {
  try {
    const destinationData = req.body;
    const newDestination = await adminDestinationService.createDestination(destinationData);
    
    res.status(201).json({
      success: true,
      message: '여행지 등록 성공',
      data: newDestination
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

// 여행지 수정
exports.updateDestination = async (req, res) => {
  try {
    const destinationId = req.params.destinationId;
    const updateData = {
      destination_name: req.body.destination_name,
      address: req.body.address,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      category: req.body.category,
      phone_number: req.body.phone_number,
      operating_hours: req.body.operating_hours
    };

    const updatedDestination = await adminDestinationService.updateDestination(destinationId, updateData);
    
    res.json({
      success: true,
      data: updatedDestination,
      message: '여행지가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('여행지 수정 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '여행지 수정 중 오류가 발생했습니다.'
    });
  }
};

// 여행지 삭제
exports.deleteDestination = async (req, res, next) => {
  try {
    const { destinationId } = req.params;
    await adminDestinationService.deleteDestination(destinationId);
    
    res.status(200).json({
      success: true,
      message: '여행지 삭제 성공'
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
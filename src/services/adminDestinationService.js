const adminDestinationRepository = require('../repositories/adminDestinationRepository');

// 모든 여행지 목록 조회
exports.getAllDestinations = async () => {
  try {
    return await adminDestinationRepository.findAllDestinations();
  } catch (error) {
    console.error('여행지 목록 조회 서비스 오류:', error);
    throw {
      status: 500,
      message: '여행지 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
};

// 특정 여행지 상세 조회
exports.getDestinationById = async (destinationId) => {
  try {
    const destination = await adminDestinationRepository.findDestinationById(destinationId);
    
    if (!destination) {
      throw {
        status: 404,
        message: '여행지를 찾을 수 없습니다.'
      };
    }
    
    return destination;
  } catch (error) {
    console.error('여행지 상세 조회 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '여행지 상세 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
};